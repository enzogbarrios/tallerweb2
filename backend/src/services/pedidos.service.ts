import type {
  CompradorPedido,
  DireccionPedido,
  EstadoPedido,
  Pedido,
  PedidoApi,
  PedidoItem,
} from '../models/pedido.model.js';
import type { Rol } from '../models/usuario.model.js';
import type { PedidosRepository } from '../repository/pedidos.repository.js';
import { ErrorApi } from '../utils/errores.js';
import type { CarritoService } from './carrito.service.js';
import type { PedidoDto } from '../schemas/pedidos.schemas.js';
import { detectarMarca, type PagosService } from './pagos.service.js';

type DatosCompra = PedidoDto;

function armarDireccionEnvio(direccion: DireccionPedido) {
  const calleYNumero = `${direccion.calle} ${direccion.numero}`;
  const partes = [calleYNumero, direccion.piso_depto, direccion.ciudad, direccion.provincia].filter(
    (parte) => !!parte,
  );
  return `${partes.join(', ')} (${direccion.codigo_postal})`;
}

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

    const sinStock = carrito.items.find((item) => item.cantidad > item.variante.stock);
    if (sinStock) {
      const variante = [sinStock.variante.talle, sinStock.variante.color].filter(Boolean).join(' / ');
      const disponible =
        sinStock.variante.stock === 0
          ? 'ya no tiene stock'
          : `solo tiene ${sinStock.variante.stock} disponibles`;
      throw new ErrorApi(
        409,
        'SIN_STOCK',
        `${sinStock.producto.nombre}${variante ? ` (${variante})` : ''} ${disponible}. Ajustá tu carrito.`,
      );
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
      direccionEnvio: armarDireccionEnvio(datos.direccion),
      subtotal: carrito.subtotal,
      envio: carrito.envio,
      total: carrito.total,
      metodoPago: 'tarjeta',
      referenciaPago: pago.referencia,
      tarjetaUltimos4: pago.ultimos4,
      tarjetaMarca: detectarMarca(datos.tarjeta.numero),
      comprador: datos.comprador,
      direccion: datos.direccion,
      items: carrito.items.map((item) => ({
        productoId: item.producto.id,
        varianteId: item.variante.id,
        talle: item.variante.talle,
        color: item.variante.color,
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

  async listarTodos() {
    const filas = await this.pedidos.listarTodos();
    const items = await this.pedidos.itemsDePedidos(filas.map((fila) => fila.pedido.id));
    const itemsPorPedido = this.agruparItems(items);

    return filas.map((fila) =>
      this.armar(fila.pedido, itemsPorPedido.get(fila.pedido.id) ?? [], fila.comprador),
    );
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

    // El estado leido arriba se pasa a la UPDATE: si otro cambio gano la carrera,
    // la condicion no se cumple y no se devuelve el stock dos veces.
    const actualizado =
      estado === 'Cancelado'
        ? await this.pedidos.cancelarDevolviendoStock(pedidoId, pedido.estado)
        : await this.pedidos.actualizarEstado(pedidoId, estado, pedido.estado);

    if (!actualizado) {
      throw new ErrorApi(
        409,
        'ESTADO_INVALIDO',
        `El pedido ya no está "${pedido.estado}" y no se pudo actualizar.`,
      );
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
      fecha: pedido.creado_en.toISOString(),
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
        talle: item.talle,
        color: item.color,
        cantidad: item.cantidad,
      })),
      comprador,
      datos_comprador: this.armarDatosComprador(pedido),
      direccion: this.armarDireccion(pedido),
      tarjeta: { marca: pedido.tarjeta_marca, ultimos4: pedido.tarjeta_ultimos4 },
    };
  }

  private armarDatosComprador(pedido: Pedido) {
    if (!pedido.comprador_nombre) return null;

    return {
      nombre: pedido.comprador_nombre,
      apellido: pedido.comprador_apellido ?? '',
      email: pedido.comprador_email ?? '',
      telefono: pedido.comprador_telefono ?? '',
      dni: pedido.comprador_dni ?? '',
    };
  }

  private armarDireccion(pedido: Pedido): DireccionPedido | null {
    if (!pedido.envio_calle) return null;

    return {
      calle: pedido.envio_calle,
      numero: pedido.envio_numero ?? '',
      piso_depto: pedido.envio_piso_depto,
      ciudad: pedido.envio_ciudad ?? '',
      provincia: pedido.envio_provincia ?? '',
      codigo_postal: pedido.envio_codigo_postal ?? '',
      indicaciones: pedido.envio_indicaciones,
    };
  }
}
