import { query } from '../db/pool.js';
import type { Categoria, CategoriaConCantidad, NuevaCategoria } from '../models/categoria.model.js';
import type { ListadoCategoriasDto, OrdenCategorias } from '../schemas/categorias.schemas.js';
import { calcularOffset, patronBusqueda } from '../utils/paginacion.js';

const ORDEN_SQL: Record<OrdenCategorias, string> = {
  nombre_asc: 'lower(c.nombre) ASC, c.id ASC',
  nombre_desc: 'lower(c.nombre) DESC, c.id DESC',
  productos_desc: 'cantidad_productos DESC, lower(c.nombre) ASC',
  recientes: 'c.creado_en DESC, c.id DESC',
};

export class CategoriasRepository {
  async listar() {
    const resultado = await query<Categoria>('SELECT * FROM categorias ORDER BY lower(nombre)');
    return resultado.rows;
  }

  async listarPaginado(filtros: ListadoCategoriasDto) {
    const parametros: unknown[] = [];
    let where = '';

    if (filtros.q) {
      parametros.push(patronBusqueda(filtros.q));
      where = 'WHERE c.nombre ILIKE $1 OR c.descripcion ILIKE $1';
    }

    const total = await query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM categorias c ${where}`,
      parametros,
    );

    const limite = parametros.length + 1;
    const items = await query<CategoriaConCantidad>(
      `SELECT c.*, COUNT(p.id)::int AS cantidad_productos
       FROM categorias c
       LEFT JOIN productos p ON p.categoria_id = c.id
       ${where}
       GROUP BY c.id
       ORDER BY ${ORDEN_SQL[filtros.orden]}
       LIMIT $${limite} OFFSET $${limite + 1}`,
      [...parametros, filtros.limite, calcularOffset(filtros.pagina, filtros.limite)],
    );

    return { items: items.rows, total: total.rows[0]?.total ?? 0 };
  }

  async buscarPorId(id: number) {
    const resultado = await query<Categoria>('SELECT * FROM categorias WHERE id = $1', [id]);
    return resultado.rows[0];
  }

  async contarProductos(id: number) {
    const resultado = await query<{ cantidad: number }>(
      'SELECT COUNT(*)::int AS cantidad FROM productos WHERE categoria_id = $1',
      [id],
    );
    return resultado.rows[0]?.cantidad ?? 0;
  }

  async crear(datos: NuevaCategoria) {
    const resultado = await query<Categoria>(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [datos.nombre, datos.descripcion],
    );
    return resultado.rows[0];
  }

  async actualizar(id: number, datos: NuevaCategoria) {
    const resultado = await query<Categoria>(
      'UPDATE categorias SET nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *',
      [datos.nombre, datos.descripcion, id],
    );
    return resultado.rows[0];
  }

  async eliminar(id: number) {
    const resultado = await query<Categoria>('DELETE FROM categorias WHERE id = $1 RETURNING *', [
      id,
    ]);
    return resultado.rows[0];
  }
}
