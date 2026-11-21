import { query } from '../db/pool.js';
import type { Categoria, NuevaCategoria } from '../models/categoria.model.js';

export class CategoriasRepository {
  async listar() {
    const resultado = await query<Categoria>('SELECT * FROM categorias ORDER BY lower(nombre)');
    return resultado.rows;
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
