import { Clasificacion } from './producto.model';
import { Usuario } from './usuario.model';

export type EstadoPedido = 'Confirmado' | 'En preparación' | 'Enviado' | 'Entregado' | 'Cancelado';

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
