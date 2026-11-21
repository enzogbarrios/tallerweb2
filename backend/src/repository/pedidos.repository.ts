import type { PoolClient } from 'pg';
import { query } from '../db/pool.js';
import { enTransaccion } from '../db/transaccion.js';
import type {
  DatosCompradorPedido,
  DireccionPedido,
  EstadoPedido,
  MarcaTarjeta,
  Pedido,
  PedidoItem,
} from '../models/pedido.model.js';
import { ErrorApi } from '../utils/errores.js';

const ORDEN_POR_DEFECTO = 'p.creado_en DESC, p.id DESC';

type FilaVenta = Pedido & {
  usuario_nombre: string;
  usuario_apellido: string;
  usuario_email: string;
};

export type ItemNuevoPedido = {
  productoId: number;
  varianteId: number;
  talle: string;
  color: string;
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
  tarjetaMarca: MarcaTarjeta;
  comprador: DatosCompradorPedido;
  direccion: DireccionPedido;
  items: ItemNuevoPedido[];
};

export class PedidosRepository {
  // crea el pedido, guarda cada item y vacia el carrito
  async crearConItems(datos: DatosNuevoPedido) {
    return await enTransaccion(async (cliente: PoolClient) => {
      const resultado = await cliente.query(
        `INSERT INTO pedidos
           (usuario_id, direccion_envio, subtotal, envio, total, estado, estado_pago,
            metodo_pago, referencia_pago, tarjeta_ultimos4, tarjeta_marca, pagado_en,
            comprador_nombre, comprador_apellido, comprador_email, comprador_telefono,
            comprador_dni, envio_calle, envio_numero, envio_piso_depto, envio_ciudad,
            envio_provincia, envio_codigo_postal, envio_indicaciones)
         VALUES ($1, $2, $3, $4, $5, 'Confirmado', 'aprobado', $6, $7, $8, $9, now(),
                 $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
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
          datos.tarjetaMarca,
          datos.comprador.nombre,
          datos.comprador.apellido,
          datos.comprador.email,
          datos.comprador.telefono,
          datos.comprador.dni,
          datos.direccion.calle,
          datos.direccion.numero,
          datos.direccion.piso_depto,
          datos.direccion.ciudad,
          datos.direccion.provincia,
          datos.direccion.codigo_postal,
          datos.direccion.indicaciones,
        ],
      );

      const fila = resultado.rows[0] as { id: number } | undefined;
      if (!fila) throw new Error('No se pudo crear el pedido');

      for (const item of datos.items) {
        const descontado = await cliente.query(
          `UPDATE producto_variantes SET stock = stock - $1
           WHERE id = $2 AND stock >= $1`,
          [item.cantidad, item.varianteId],
        );

        if (descontado.rowCount === 0) {
          const variante = [item.talle, item.color].filter(Boolean).join(' / ');
          throw new ErrorApi(
            409,
            'SIN_STOCK',
            `No hay stock suficiente de ${item.nombre}${variante ? ` (${variante})` : ''}.`,
          );
        }

        await cliente.query(
          `INSERT INTO pedido_items
             (pedido_id, producto_id, variante_id, talle, color, nombre, clasificacion, imagen,
              precio_unitario, cantidad)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            fila.id,
            item.productoId,
            item.varianteId,
            item.talle,
            item.color,
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

  async actualizarEstado(id: number, estado: EstadoPedido, estadoEsperado: EstadoPedido) {
    const resultado = await query<Pedido>(
      `UPDATE pedidos
       SET estado = $1, actualizado_en = now()
       WHERE id = $2 AND estado = $3
       RETURNING *`,
      [estado, id, estadoEsperado],
    );
    return resultado.rows[0];
  }

  async cancelarDevolviendoStock(id: number, estadoEsperado: EstadoPedido) {
    return await enTransaccion(async (cliente) => {
      // La propia UPDATE toma el lock y vuelve a chequear el estado: si otro
      // request ya lo cambio, no afecta filas y no se toca el stock.
      const resultado = await cliente.query<Pedido>(
        `UPDATE pedidos
         SET estado = 'Cancelado', actualizado_en = now()
         WHERE id = $1 AND estado = $2
         RETURNING *`,
        [id, estadoEsperado],
      );

      const pedido = resultado.rows[0];
      if (!pedido) {
        return undefined;
      }

      await cliente.query(
        `UPDATE producto_variantes v
         SET stock = v.stock + pi.cantidad
         FROM pedido_items pi
         WHERE pi.pedido_id = $1 AND pi.variante_id = v.id`,
        [id],
      );

      return pedido;
    });
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
      `SELECT p.* FROM pedidos p
       WHERE p.usuario_id = $1
       ORDER BY ${ORDEN_POR_DEFECTO}`,
      [usuarioId],
    );
    return resultado.rows;
  }

  async listarTodos() {
    const resultado = await query<FilaVenta>(
      `SELECT p.*, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email
       FROM pedidos p
       JOIN usuarios u ON u.id = p.usuario_id
       ORDER BY ${ORDEN_POR_DEFECTO}`,
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
