import { Pagina } from './pagina.model';
import { Clasificacion } from './producto.model';
import { Usuario } from './usuario.model';

export const ESTADOS_PEDIDO = [
  'Confirmado',
  'En preparación',
  'Enviado',
  'Entregado',
  'Cancelado',
] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado';

export type Comprador = Pick<Usuario, 'id' | 'nombre' | 'apellido' | 'email'>;

export interface ProductoPedido {
  id: number | null;
  nombre: string;
  clasificacion: Clasificacion;
  imagen: string;
  precio: number;
}

export interface ItemPedido {
  producto: ProductoPedido;
  cantidad: number;
}

export interface Pedido {
  id: number;
  fecha: string;
  direccion_envio: string;
  items: ItemPedido[];
  subtotal: number;
  envio: number;
  total: number;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  comprador: Comprador | null;
}

export interface TarjetaPago {
  numero: string;
  titular: string;
  vencimiento: string;
  cvv: string;
}

export interface DatosPedido {
  direccion_envio: string;
  tarjeta: TarjetaPago;
}

export const ORDENES_VENTAS = ['recientes', 'antiguos', 'total_desc', 'total_asc'] as const;

export type OrdenVentas = (typeof ORDENES_VENTAS)[number];

export interface FiltrosVentas {
  pagina: number;
  limite: number;
  estado: EstadoPedido | null;
  q: string;
  desde: string;
  hasta: string;
  orden: OrdenVentas;
}

export interface ResumenVentas {
  cantidad: number;
  facturado: number;
}

export interface PaginaVentas extends Pagina<Pedido> {
  resumen: ResumenVentas;
}
