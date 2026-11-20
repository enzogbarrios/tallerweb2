import type { PoolClient } from 'pg';
import { query } from '../db/pool.js';
import { enTransaccion } from '../db/transaccion.js';
import type { Pedido, PedidoItem } from '../models/pedido.model.js';

export type ItemNuevoPedido = {
  productoId: number;
  nombre: string;
  clasificacion: string;
  imagen: string;
  precioUnitario: number;
  cantidad: number;
};

export type DatosNuevoPedido = {
  usuarioId: number;
  direccionEnvio: string;
  subtotal: number;
  envio: number;
  total: number;
  metodoPago: string;
  referenciaPago: string;
  tarjetaUltimos4: string;
  items: ItemNuevoPedido[];
};

export class PedidosRepository {

  // crea el pedido, guarda cada item y vacia el carrito
  async crearConItems(datos: DatosNuevoPedido) {
    return await enTransaccion(async (cliente: PoolClient) => {
      const resultado = await cliente.query(
        `INSERT INTO pedidos
           (usuario_id, direccion_envio, subtotal, envio, total, estado, estado_pago,
            metodo_pago, referencia_pago, tarjeta_ultimos4, pagado_en)
         VALUES ($1, $2, $3, $4, $5, 'Confirmado', 'aprobado', $6, $7, $8, now())
         RETURNING id`,
        [
          datos.usuarioId,
          datos.direccionEnvio,
          datos.subtotal,
          datos.envio,
          datos.total,
          datos.metodoPago,
          datos.referenciaPago,
          datos.tarjetaUltimos4,
        ],
      );

      const fila = resultado.rows[0] as { id: number } | undefined;
      if (!fila) throw new Error('No se pudo crear el pedido');

      for (const item of datos.items) {
        await cliente.query(
          `INSERT INTO pedido_items
             (pedido_id, producto_id, nombre, clasificacion, imagen, precio_unitario, cantidad)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            fila.id,
            item.productoId,
            item.nombre,
            item.clasificacion,
            item.imagen,
            item.precioUnitario,
            item.cantidad,
          ],
        );
      }

      await cliente.query('DELETE FROM carrito_items WHERE usuario_id = $1', [datos.usuarioId]);

      return fila.id;
    });
  }

  async buscarPorId(id: number) {
    const resultado = await query<Pedido>('SELECT * FROM pedidos WHERE id = $1', [id]);
    return resultado.rows[0];
  }

  async itemsDePedido(pedidoId: number) {
    const resultado = await query<PedidoItem>(
      'SELECT * FROM pedido_items WHERE pedido_id = $1 ORDER BY id',
      [pedidoId],
    );
    return resultado.rows;
  }

  async itemsDePedidos(pedidoIds: number[]) {
    if (pedidoIds.length === 0) return [];

    const resultado = await query<PedidoItem>(
      'SELECT * FROM pedido_items WHERE pedido_id = ANY($1::int[]) ORDER BY id',
      [pedidoIds],
    );
    return resultado.rows;
  }

  async listarPorUsuario(usuarioId: number) {
    const resultado = await query<Pedido>(
      'SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY creado_en DESC',
      [usuarioId],
    );
    return resultado.rows;
  }

  async listarTodos() {
    const resultado = await query<
      Pedido & { usuario_nombre: string; usuario_apellido: string; usuario_email: string }
    >(
      `SELECT p.*, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email
       FROM pedidos p
       JOIN usuarios u ON u.id = p.usuario_id
       ORDER BY p.creado_en DESC`,
    );

    return resultado.rows.map((fila) => {
      const { usuario_nombre, usuario_apellido, usuario_email, ...pedido } = fila;
      return {
        pedido,
        comprador: {
          id: pedido.usuario_id,
          nombre: usuario_nombre,
          apellido: usuario_apellido,
          email: usuario_email,
        },
      };
    });
  }
}
