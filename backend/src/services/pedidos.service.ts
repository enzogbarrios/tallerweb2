import type {
  CompradorPedido,
  Pedido,
  PedidoApi,
  PedidoItem,
} from '../models/pedido.model.js';
import type { Rol } from '../models/usuario.model.js';
import type { PedidosRepository } from '../repository/pedidos.repository.js';
import { ErrorApi } from '../utils/errores.js';
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
      throw new ErrorApi(504, 'PAGO_TIMEOUT', 'La pasarela de pago no respondió. Intentá de nuevo.');
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

  async listar(usuarioId: number, rol: Rol) {
    if (rol === 'admin') {
      const filas = await this.pedidos.listarTodos();
      const items = await this.pedidos.itemsDePedidos(filas.map((fila) => fila.pedido.id));
      const itemsPorPedido = this.agruparItems(items);

      return filas.map((fila) =>
        this.armar(fila.pedido, itemsPorPedido.get(fila.pedido.id) ?? [], fila.comprador),
      );
    }

    const pedidos = await this.pedidos.listarPorUsuario(usuarioId);
    const items = await this.pedidos.itemsDePedidos(pedidos.map((pedido) => pedido.id));
    const itemsPorPedido = this.agruparItems(items);

    return pedidos.map((pedido) => this.armar(pedido, itemsPorPedido.get(pedido.id) ?? []));
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
