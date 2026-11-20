export const ESTADOS_PEDIDO = [
  'Confirmado',
  'En preparación',
  'Enviado',
  'Entregado',
  'Cancelado',
] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado';

export const PROVINCIAS = [
  'Buenos Aires',
  'Ciudad Autónoma de Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
] as const;

export type Provincia = (typeof PROVINCIAS)[number];

export type MarcaTarjeta = 'visa' | 'mastercard' | 'amex' | 'otra';

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
  tarjeta_marca!: MarcaTarjeta | null;
  comprador_nombre!: string | null;
  comprador_apellido!: string | null;
  comprador_email!: string | null;
  comprador_telefono!: string | null;
  comprador_dni!: string | null;
  envio_calle!: string | null;
  envio_numero!: string | null;
  envio_piso_depto!: string | null;
  envio_ciudad!: string | null;
  envio_provincia!: string | null;
  envio_codigo_postal!: string | null;
  envio_indicaciones!: string | null;
  pagado_en!: Date | null;
  creado_en!: Date;
  actualizado_en!: Date;
}

export class PedidoItem {
  id!: number;
  pedido_id!: number;
  producto_id!: number | null;
  variante_id!: number | null;
  talle!: string;
  color!: string;
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

export type DatosCompradorPedido = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
};

export type DireccionPedido = {
  calle: string;
  numero: string;
  piso_depto: string | null;
  ciudad: string;
  provincia: string;
  codigo_postal: string;
  indicaciones: string | null;
};

export type TarjetaPedido = {
  marca: MarcaTarjeta | null;
  ultimos4: string | null;
};

export type ItemPedidoApi = {
  producto: {
    id: number | null;
    nombre: string;
    clasificacion: string;
    imagen: string;
    precio: number;
  };
  talle: string;
  color: string;
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
  datos_comprador: DatosCompradorPedido | null;
  direccion: DireccionPedido | null;
  tarjeta: TarjetaPedido;
};
