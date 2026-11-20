import { query } from '../db/pool.js';
import type { ItemCarritoFila } from '../models/carrito.model.js';

export class CarritoRepository {
  async listar(usuarioId: number) {
    const resultado = await query<ItemCarritoFila>(
      `SELECT p.id, p.nombre, p.descripcion, p.categoria_id, c.nombre AS clasificacion,
              p.precio, p.imagen, p.destacado, p.creado_en, ci.cantidad
       FROM carrito_items ci
       JOIN productos p ON p.id = ci.producto_id
       JOIN categorias c ON c.id = p.categoria_id
       WHERE ci.usuario_id = $1
       ORDER BY p.id`,
      [usuarioId],
    );

    return resultado.rows;
  }

  async guardar(usuarioId: number, productoId: number, cantidad: number) {
    await query(
      `INSERT INTO carrito_items (usuario_id, producto_id, cantidad)
       VALUES ($1, $2, $3)
       ON CONFLICT (usuario_id, producto_id) DO UPDATE SET cantidad = EXCLUDED.cantidad`,
      [usuarioId, productoId, cantidad],
    );
  }

  async eliminar(usuarioId: number, productoId: number) {
    await query('DELETE FROM carrito_items WHERE usuario_id = $1 AND producto_id = $2', [
      usuarioId,
      productoId,
    ]);
  }

  async vaciar(usuarioId: number) {
    await query('DELETE FROM carrito_items WHERE usuario_id = $1', [usuarioId]);
  }
}
