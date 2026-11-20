import type { PoolClient } from 'pg';
import { query } from '../db/pool.js';
import { enTransaccion } from '../db/transaccion.js';
import type { NuevaVariante, NuevoProducto, Producto, Variante } from '../models/producto.model.js';
import type { FiltrosProductos, OrdenProductos } from '../schemas/productos.schemas.js';
import { calcularOffset, patronBusqueda } from '../utils/paginacion.js';

const STOCK_TOTAL = `(SELECT COALESCE(SUM(v.stock), 0) FROM producto_variantes v WHERE v.producto_id = p.id)`;

const ORDEN_SQL: Record<OrdenProductos, string> = {
  recientes: 'p.creado_en DESC, p.id DESC',
  nombre_asc: 'p.nombre ASC, p.id ASC',
  nombre_desc: 'p.nombre DESC, p.id DESC',
  precio_asc: 'p.precio ASC, p.id ASC',
  precio_desc: 'p.precio DESC, p.id DESC',
  stock_asc: `${STOCK_TOTAL} ASC, p.id ASC`,
  stock_desc: `${STOCK_TOTAL} DESC, p.id DESC`,
};

function armarWhere(filtros: FiltrosProductos) {
  const condiciones: string[] = [];
  const parametros: unknown[] = [];

  const agregar = (valor: unknown) => {
    parametros.push(valor);
    return `$${parametros.length}`;
  };

  if (filtros.q) {
    const texto = agregar(patronBusqueda(filtros.q));
    condiciones.push(`(p.nombre ILIKE ${texto} OR p.descripcion ILIKE ${texto})`);
  }
  if (filtros.categoria_id !== undefined) {
    condiciones.push(`p.categoria_id = ${agregar(filtros.categoria_id)}`);
  }
  if (filtros.destacado !== undefined) {
    condiciones.push(`p.destacado = ${agregar(filtros.destacado)}`);
  }
  if (filtros.precio_min !== undefined) {
    condiciones.push(`p.precio >= ${agregar(filtros.precio_min)}`);
  }
  if (filtros.precio_max !== undefined) {
    condiciones.push(`p.precio <= ${agregar(filtros.precio_max)}`);
  }
  if (filtros.stock === 'sin_stock') {
    condiciones.push(`${STOCK_TOTAL} = 0`);
  } else if (filtros.stock === 'con_stock') {
    condiciones.push(`${STOCK_TOTAL} > 0`);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  return { where, parametros };
}

const SELECT_PRODUCTO = `
  SELECT p.*, c.nombre AS clasificacion,
         COALESCE((
           SELECT json_agg(
                    json_build_object('id', v.id, 'talle', v.talle, 'color', v.color, 'stock', v.stock)
                    ORDER BY v.id
                  )
           FROM producto_variantes v
           WHERE v.producto_id = p.id
         ), '[]'::json) AS variantes,
         ${STOCK_TOTAL}::int AS stock
  FROM productos p
  JOIN categorias c ON c.id = p.categoria_id`;

async function guardarVariantes(cliente: PoolClient, productoId: number, variantes: NuevaVariante[]) {
  const idsQueQuedan = variantes
    .map((variante) => variante.id)
    .filter((id): id is number => id !== undefined);

  await cliente.query(
    'DELETE FROM producto_variantes WHERE producto_id = $1 AND NOT (id = ANY($2::int[]))',
    [productoId, idsQueQuedan],
  );

  for (const variante of variantes) {
    if (variante.id !== undefined) {
      const actualizada = await cliente.query(
        `UPDATE producto_variantes SET talle = $1, color = $2, stock = $3
         WHERE id = $4 AND producto_id = $5`,
        [variante.talle, variante.color, variante.stock, variante.id, productoId],
      );
      if (actualizada.rowCount === 1) continue;
    }

    await cliente.query(
      'INSERT INTO producto_variantes (producto_id, talle, color, stock) VALUES ($1, $2, $3, $4)',
      [productoId, variante.talle, variante.color, variante.stock],
    );
  }
}

export class ProductosRepository {
  async listar() {
    const resultado = await query<Producto>(`${SELECT_PRODUCTO} ORDER BY p.id`);
    return resultado.rows;
  }

  async listarFiltrado(filtros: FiltrosProductos) {
    const { where, parametros } = armarWhere(filtros);
    const limite = `$${parametros.length + 1}`;
    const offset = `$${parametros.length + 2}`;

    const [filas, conteo] = await Promise.all([
      query<Producto>(
        `${SELECT_PRODUCTO} ${where}
         ORDER BY ${ORDEN_SQL[filtros.orden]}
         LIMIT ${limite} OFFSET ${offset}`,
        [...parametros, filtros.limite, calcularOffset(filtros.pagina, filtros.limite)],
      ),
      query<{ total: number }>(`SELECT count(*)::int AS total FROM productos p ${where}`, parametros),
    ]);

    return { items: filas.rows, total: conteo.rows[0]?.total ?? 0 };
  }

  async buscarPorId(id: number) {
    const resultado = await query<Producto>(`${SELECT_PRODUCTO} WHERE p.id = $1`, [id]);
    return resultado.rows[0];
  }

  async buscarVariante(varianteId: number) {
    const resultado = await query<Variante & { producto_id: number }>(
      'SELECT id, producto_id, talle, color, stock FROM producto_variantes WHERE id = $1',
      [varianteId],
    );
    return resultado.rows[0];
  }

  async crear(datos: NuevoProducto) {
    const id = await enTransaccion(async (cliente) => {
      const resultado = await cliente.query(
        `INSERT INTO productos (nombre, descripcion, categoria_id, precio, imagen, destacado)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          datos.nombre,
          datos.descripcion,
          datos.categoria_id,
          datos.precio,
          datos.imagen,
          datos.destacado,
        ],
      );
      const fila = resultado.rows[0] as { id: number } | undefined;
      if (!fila) throw new Error('No se pudo crear el producto');

      await guardarVariantes(cliente, fila.id, datos.variantes);
      return fila.id;
    });

    return await this.buscarPorId(id);
  }

  async actualizar(id: number, datos: NuevoProducto) {
    const existe = await enTransaccion(async (cliente) => {
      const resultado = await cliente.query(
        `UPDATE productos
         SET nombre = $1, descripcion = $2, categoria_id = $3,
             precio = $4, imagen = $5, destacado = $6
         WHERE id = $7`,
        [
          datos.nombre,
          datos.descripcion,
          datos.categoria_id,
          datos.precio,
          datos.imagen,
          datos.destacado,
          id,
        ],
      );
      if (resultado.rowCount === 0) return false;

      await guardarVariantes(cliente, id, datos.variantes);
      return true;
    });

    return existe ? await this.buscarPorId(id) : undefined;
  }

  async eliminar(id: number) {
    const producto = await this.buscarPorId(id);
    if (!producto) return undefined;

    await query('DELETE FROM productos WHERE id = $1', [id]);
    return producto;
  }
}
