// Consultas SQL de la tabla productos.
import { query } from '../db/pool.js';
import type { Producto } from '../models/producto.model.js';

export class ProductosRepository {
  async listar() {
    const resultado = await query<Producto>('SELECT * FROM productos ORDER BY id');
    return resultado.rows;
  }

  async buscarPorId(id: number) {
    const resultado = await query<Producto>('SELECT * FROM productos WHERE id = $1', [id]);
    return resultado.rows[0];
  }
}
