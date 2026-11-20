import { query } from '../db/pool.js';
import type { NuevoProducto, Producto } from '../models/producto.model.js';

export class ProductosRepository {
  async listar() {
    const resultado = await query<Producto>('SELECT * FROM productos ORDER BY id');
    return resultado.rows;
  }

  async buscarPorId(id: number) {
    const resultado = await query<Producto>('SELECT * FROM productos WHERE id = $1', [id]);
    return resultado.rows[0];
  }

  async crear(datos: NuevoProducto) {
    const resultado = await query<Producto>(
      `INSERT INTO productos (nombre, descripcion, clasificacion, precio, imagen, destacado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        datos.nombre,
        datos.descripcion,
        datos.clasificacion,
        datos.precio,
        datos.imagen,
        datos.destacado,
      ],
    );

    return resultado.rows[0];
  }

  async actualizar(id: number, datos: NuevoProducto) {
    const resultado = await query<Producto>(
      `UPDATE productos
       SET nombre = $1, descripcion = $2, clasificacion = $3,
           precio = $4, imagen = $5, destacado = $6
       WHERE id = $7
       RETURNING *`,
      [
        datos.nombre,
        datos.descripcion,
        datos.clasificacion,
        datos.precio,
        datos.imagen,
        datos.destacado,
        id,
      ],
    );

    return resultado.rows[0];
  }

  async eliminar(id: number) {
    const resultado = await query<Producto>('DELETE FROM productos WHERE id = $1 RETURNING *', [
      id,
    ]);
    return resultado.rows[0];
  }
}
