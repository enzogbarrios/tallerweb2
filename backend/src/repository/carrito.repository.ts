import { query } from '../db/pool.js';
import type { ItemCarritoFila } from '../models/carrito.model.js';

export class CarritoRepository {
  async listar(usuarioId: number) {
    const resultado = await query<ItemCarritoFila>(
      `SELECT p.id, p.nombre, p.descripcion, p.categoria_id, c.nombre AS clasificacion,
              p.precio, p.imagen, p.destacado,
              v.id AS variante_id, v.talle, v.color, v.stock, ci.cantidad
       FROM carrito_items ci
       JOIN producto_variantes v ON v.id = ci.variante_id
       JOIN productos p ON p.id = v.producto_id
       JOIN categorias c ON c.id = p.categoria_id
       WHERE ci.usuario_id = $1
       ORDER BY p.id, v.id`,
      [usuarioId],
    );

    return resultado.rows;
  }

  async cantidadDe(usuarioId: number, varianteId: number) {
    const resultado = await query<{ cantidad: number }>(
      'SELECT cantidad FROM carrito_items WHERE usuario_id = $1 AND variante_id = $2',
      [usuarioId, varianteId],
    );
    return resultado.rows[0]?.cantidad ?? 0;
  }

  async guardar(usuarioId: number, productoId: number, varianteId: number, cantidad: number) {
    await query(
      `INSERT INTO carrito_items (usuario_id, producto_id, variante_id, cantidad)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (usuario_id, variante_id) DO UPDATE SET cantidad = EXCLUDED.cantidad`,
      [usuarioId, productoId, varianteId, cantidad],
    );
  }

  async eliminar(usuarioId: number, varianteId: number) {
    await query('DELETE FROM carrito_items WHERE usuario_id = $1 AND variante_id = $2', [
      usuarioId,
      varianteId,
    ]);
  }

  async vaciar(usuarioId: number) {
    await query('DELETE FROM carrito_items WHERE usuario_id = $1', [usuarioId]);
  }
}
