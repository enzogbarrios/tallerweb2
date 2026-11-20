import type {
  CompradorPedido,
  EstadoPedido,
  Pedido,
  PedidoApi,
  PedidoItem,
} from '../models/pedido.model.js';
import type { Rol } from '../models/usuario.model.js';
import type { PedidosRepository } from '../repository/pedidos.repository.js';
import type { FiltrosVentas } from '../schemas/pedidos.schemas.js';
import { ErrorApi } from '../utils/errores.js';
import { armarPagina } from '../utils/paginacion.js';
import type { CarritoService } from './carrito.service.js';
import type { PagosService } from './pagos.service.js';

export type DatosCompra = {
  direccion_envio: string;
  tarjeta: {
    numero: string;
    titular: string;
    vencimiento: string;
    cvv: string;
  };
};

// desde cada estado solo se puede pasar a los de aca
const SIGUIENTES_ESTADOS: Record<EstadoPedido, EstadoPedido[]> = {
  Confirmado: ['En preparación', 'Cancelado'],
  'En preparación': ['Enviado'],
  Enviado: ['Entregado'],
  Entregado: [],
  Cancelado: [],
};

export class PedidosService {
  private readonly carrito: CarritoService;
  private readonly pedidos: PedidosRepository;
  private readonly pagos: PagosService;

  constructor(carrito: CarritoService, pedidos: PedidosRepository, pagos: PagosService) {
    this.carrito = carrito;
    this.pedidos = pedidos;
    this.pagos = pagos;
  }

  async crear(usuarioId: number, datos: DatosCompra) {
    const carrito = await this.carrito.obtener(usuarioId);

    if (carrito.items.length === 0) {
      throw new ErrorApi(400, 'CARRITO_VACIO', 'Tu carrito está vacío.');
    }

    const pago = this.pagos.simular(datos.tarjeta.numero);

    if (pago.estado === 'rechazado') {
      throw new ErrorApi(402, 'PAGO_RECHAZADO', 'El pago fue rechazado. Probá con otra tarjeta.');
    }

    if (pago.estado === 'timeout') {
      throw new ErrorApi(
        504,
        'PAGO_TIMEOUT',
        'La pasarela de pago no respondió. Intentá de nuevo.',
      );
    }

    const pedidoId = await this.pedidos.crearConItems({
      usuarioId,
      direccionEnvio: datos.direccion_envio,
      subtotal: carrito.subtotal,
      envio: carrito.envio,
      total: carrito.total,
      metodoPago: 'tarjeta',
      referenciaPago: pago.referencia,
      tarjetaUltimos4: pago.ultimos4,
      items: carrito.items.map((item) => ({
        productoId: item.producto.id,
        nombre: item.producto.nombre,
        clasificacion: item.producto.clasificacion,
        imagen: item.producto.imagen,
        precioUnitario: item.producto.precio,
        cantidad: item.cantidad,
      })),
    });

    const pedido = await this.pedidos.buscarPorId(pedidoId);

    if (!pedido) {
      throw new Error('No se pudo leer el pedido recién creado');
    }

    const items = await this.pedidos.itemsDePedido(pedidoId);
    return this.armar(pedido, items);
  }

  async listar(usuarioId: number) {
    const pedidos = await this.pedidos.listarPorUsuario(usuarioId);
    const items = await this.pedidos.itemsDePedidos(pedidos.map((pedido) => pedido.id));
    const itemsPorPedido = this.agruparItems(items);

    return pedidos.map((pedido) => this.armar(pedido, itemsPorPedido.get(pedido.id) ?? []));
  }

  async listarTodos(filtros: FiltrosVentas) {
    const [filas, resumen] = await Promise.all([
      this.pedidos.listarTodos(filtros),
      this.pedidos.resumenVentas(filtros),
    ]);
    const items = await this.pedidos.itemsDePedidos(filas.map((fila) => fila.pedido.id));
    const itemsPorPedido = this.agruparItems(items);

    const ventas = filas.map((fila) =>
      this.armar(fila.pedido, itemsPorPedido.get(fila.pedido.id) ?? [], fila.comprador),
    );

    return {
      ...armarPagina(ventas, resumen.total, filtros.pagina, filtros.limite),
      resumen: { cantidad: resumen.cantidad, facturado: resumen.facturado },
    };
  }

  async cambiarEstado(pedidoId: number, estado: EstadoPedido) {
    const pedido = await this.pedidos.buscarPorId(pedidoId);

    if (!pedido) {
      throw new ErrorApi(404, 'PEDIDO_NO_ENCONTRADO', 'El pedido no existe.');
    }

    if (pedido.estado === estado) {
      throw new ErrorApi(409, 'ESTADO_INVALIDO', `El pedido ya está en estado "${estado}".`);
    }

    const siguientes = SIGUIENTES_ESTADOS[pedido.estado];

    if (siguientes.length === 0) {
      throw new ErrorApi(
        409,
        'ESTADO_INVALIDO',
        `El pedido está "${pedido.estado}" y ya no se puede modificar.`,
      );
    }

    if (!siguientes.includes(estado)) {
      throw new ErrorApi(
        409,
        'ESTADO_INVALIDO',
        `No se puede pasar de "${pedido.estado}" a "${estado}".`,
      );
    }

    const actualizado = await this.pedidos.actualizarEstado(pedidoId, estado);

    if (!actualizado) {
      throw new ErrorApi(404, 'PEDIDO_NO_ENCONTRADO', 'El pedido no existe.');
    }

    const items = await this.pedidos.itemsDePedido(pedidoId);
    return this.armar(actualizado, items);
  }

  async obtener(usuarioId: number, rol: Rol, pedidoId: number) {
    const pedido = await this.pedidos.buscarPorId(pedidoId);

    if (!pedido || (rol !== 'admin' && pedido.usuario_id !== usuarioId)) {
      throw new ErrorApi(404, 'PEDIDO_NO_ENCONTRADO', 'El pedido no existe.');
    }

    const items = await this.pedidos.itemsDePedido(pedidoId);
    return this.armar(pedido, items);
  }

  private agruparItems(items: PedidoItem[]) {
    const itemsPorPedido = new Map<number, PedidoItem[]>();

    for (const item of items) {
      const lista = itemsPorPedido.get(item.pedido_id) ?? [];
      lista.push(item);
      itemsPorPedido.set(item.pedido_id, lista);
    }

    return itemsPorPedido;
  }

  private armar(
    pedido: Pedido,
    items: PedidoItem[],
    comprador: CompradorPedido | null = null,
  ): PedidoApi {
    return {
      id: pedido.id,
      fecha: pedido.creado_en,
      direccion_envio: pedido.direccion_envio,
      subtotal: pedido.subtotal,
      envio: pedido.envio,
      total: pedido.total,
      estado: pedido.estado,
      estado_pago: pedido.estado_pago,
      items: items.map((item) => ({
        producto: {
          id: item.producto_id,
          nombre: item.nombre,
          clasificacion: item.clasificacion,
          imagen: item.imagen,
          precio: item.precio_unitario,
        },
        cantidad: item.cantidad,
      })),
      comprador,
    };
  }
}
