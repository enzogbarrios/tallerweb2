export const ESTADOS_PEDIDO = [
  'Confirmado',
  'En preparación',
  'Enviado',
  'Entregado',
  'Cancelado',
] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado';

export class Pedido {
  id!: number;
  usuario_id!: number;
  direccion_envio!: string;
  subtotal!: number;
  envio!: number;
  total!: number;
  estado!: EstadoPedido;
  estado_pago!: EstadoPago;
  metodo_pago!: string;
  referencia_pago!: string | null;
  tarjeta_ultimos4!: string | null;
  pagado_en!: Date | null;
  creado_en!: Date;
  actualizado_en!: Date;
}

export class PedidoItem {
  id!: number;
  pedido_id!: number;
  producto_id!: number | null;
  nombre!: string;
  clasificacion!: string;
  imagen!: string;
  precio_unitario!: number;
  cantidad!: number;
}

export type CompradorPedido = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
};

export type ItemPedidoApi = {
  producto: {
    id: number | null;
    nombre: string;
    clasificacion: string;
    imagen: string;
    precio: number;
  };
  cantidad: number;
};

export type PedidoApi = {
  id: number;
  fecha: Date;
  direccion_envio: string;
  subtotal: number;
  envio: number;
  total: number;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  items: ItemPedidoApi[];
  comprador: CompradorPedido | null;
};
