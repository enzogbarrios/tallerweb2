// Consultas SQL de la tabla productos.
import { query } from '../db/pool.js';

export async function listar() {
  const resultado = await query('SELECT * FROM productos ORDER BY id');
  return resultado.rows;
}

export async function buscarPorId(id) {
  const resultado = await query('SELECT * FROM productos WHERE id = $1', [id]);
  return resultado.rows[0];
}
