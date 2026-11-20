import type { PoolClient } from 'pg';
import { query } from '../db/pool.js';
import { enTransaccion } from '../db/transaccion.js';
import type { EstadoPedido, Pedido, PedidoItem } from '../models/pedido.model.js';
import type { FiltrosVentas, OrdenVentas } from '../schemas/pedidos.schemas.js';
import { calcularOffset } from '../utils/paginacion.js';

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

const ORDEN_SQL: Record<OrdenVentas, string> = {
  recientes: 'p.creado_en DESC, p.id DESC',
  antiguos: 'p.creado_en ASC, p.id ASC',
  total_desc: 'p.total DESC, p.id DESC',
  total_asc: 'p.total ASC, p.id ASC',
};

type FilaVenta = Pedido & {
  usuario_nombre: string;
  usuario_apellido: string;
  usuario_email: string;
};

function escaparLike(texto: string) {
  return texto.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);
}

function armarFiltrosVentas(filtros: FiltrosVentas) {
  const condiciones: string[] = [];
  const parametros: unknown[] = [];

  const agregar = (condicion: (n: string) => string, valor: unknown) => {
    parametros.push(valor);
    condiciones.push(condicion(`$${parametros.length}`));
  };

  if (filtros.estado) {
    agregar((n) => `p.estado = ${n}`, filtros.estado);
  }

  if (filtros.q) {
    const numero = /^#?\d{1,9}$/.test(filtros.q) ? Number(filtros.q.replace('#', '')) : null;

    if (numero !== null) {
      agregar((n) => `p.id = ${n}`, numero);
    } else {
      agregar(
        (n) =>
          `(u.nombre ILIKE ${n} OR u.apellido ILIKE ${n} OR u.email ILIKE ${n}
            OR (u.nombre || ' ' || u.apellido) ILIKE ${n})`,
        `%${escaparLike(filtros.q)}%`,
      );
    }
  }

  if (filtros.desde) {
    agregar(
      (n) => `p.creado_en >= (${n}::date::timestamp AT TIME ZONE '${ZONA_HORARIA}')`,
      filtros.desde,
    );
  }

  if (filtros.hasta) {
    agregar(
      (n) => `p.creado_en < ((${n}::date + 1)::timestamp AT TIME ZONE '${ZONA_HORARIA}')`,
      filtros.hasta,
    );
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  return { where, parametros };
}

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

  async actualizarEstado(id: number, estado: EstadoPedido) {
    const resultado = await query<Pedido>(
      `UPDATE pedidos
       SET estado = $1, actualizado_en = now()
       WHERE id = $2
       RETURNING *`,
      [estado, id],
    );
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

  async listarTodos(filtros: FiltrosVentas) {
    const { where, parametros } = armarFiltrosVentas(filtros);
    const limite = parametros.length + 1;
    const offset = parametros.length + 2;

    const resultado = await query<FilaVenta>(
      `SELECT p.*, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.email AS usuario_email
       FROM pedidos p
       JOIN usuarios u ON u.id = p.usuario_id
       ${where}
       ORDER BY ${ORDEN_SQL[filtros.orden]}
       LIMIT $${limite} OFFSET $${offset}`,
      [...parametros, filtros.limite, calcularOffset(filtros.pagina, filtros.limite)],
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

  async resumenVentas(filtros: FiltrosVentas) {
    const { where, parametros } = armarFiltrosVentas(filtros);

    const resultado = await query<{ total: string; cantidad: string; facturado: string }>(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE p.estado <> 'Cancelado') AS cantidad,
              COALESCE(SUM(p.total) FILTER (WHERE p.estado <> 'Cancelado'), 0) AS facturado
       FROM pedidos p
       JOIN usuarios u ON u.id = p.usuario_id
       ${where}`,
      parametros,
    );

    const fila = resultado.rows[0];
    return {
      total: Number(fila?.total ?? 0),
      cantidad: Number(fila?.cantidad ?? 0),
      facturado: Number(fila?.facturado ?? 0),
    };
  }
}
