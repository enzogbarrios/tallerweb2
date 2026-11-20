import { query } from '../db/pool.js';
import type { NuevoProducto, Producto } from '../models/producto.model.js';
import type { FiltrosProductos, OrdenProductos } from '../schemas/productos.schemas.js';
import { calcularOffset, patronBusqueda } from '../utils/paginacion.js';

const ORDEN_SQL: Record<OrdenProductos, string> = {
  recientes: 'p.creado_en DESC, p.id DESC',
  nombre_asc: 'p.nombre ASC, p.id ASC',
  nombre_desc: 'p.nombre DESC, p.id DESC',
  precio_asc: 'p.precio ASC, p.id ASC',
  precio_desc: 'p.precio DESC, p.id DESC',
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

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  return { where, parametros };
}

const SELECT_PRODUCTO = `
  SELECT p.*, c.nombre AS clasificacion
  FROM productos p
  JOIN categorias c ON c.id = p.categoria_id`;

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

  async crear(datos: NuevoProducto) {
    const resultado = await query<Producto>(
      `WITH p AS (
         INSERT INTO productos (nombre, descripcion, categoria_id, precio, imagen, destacado)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *
       )
       SELECT p.*, c.nombre AS clasificacion FROM p JOIN categorias c ON c.id = p.categoria_id`,
      [
        datos.nombre,
        datos.descripcion,
        datos.categoria_id,
        datos.precio,
        datos.imagen,
        datos.destacado,
      ],
    );

    return resultado.rows[0];
  }

  async actualizar(id: number, datos: NuevoProducto) {
    const resultado = await query<Producto>(
      `WITH p AS (
         UPDATE productos
         SET nombre = $1, descripcion = $2, categoria_id = $3,
             precio = $4, imagen = $5, destacado = $6
         WHERE id = $7
         RETURNING *
       )
       SELECT p.*, c.nombre AS clasificacion FROM p JOIN categorias c ON c.id = p.categoria_id`,
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

    return resultado.rows[0];
  }

  async eliminar(id: number) {
    const resultado = await query<Producto>(
      `WITH p AS (DELETE FROM productos WHERE id = $1 RETURNING *)
       SELECT p.*, c.nombre AS clasificacion FROM p JOIN categorias c ON c.id = p.categoria_id`,
      [id],
    );
    return resultado.rows[0];
  }
}
