import { query } from '../db/pool.js';
import type { NuevoProducto, Producto } from '../models/producto.model.js';

const SELECT_PRODUCTO = `
  SELECT p.*, c.nombre AS clasificacion
  FROM productos p
  JOIN categorias c ON c.id = p.categoria_id`;

export class ProductosRepository {
  async listar() {
    const resultado = await query<Producto>(`${SELECT_PRODUCTO} ORDER BY p.id`);
    return resultado.rows;
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
