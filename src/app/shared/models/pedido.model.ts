import { ItemCarrito } from './carrito.model';

export type EstadoPedido = 'Confirmado' | 'En preparación' | 'Enviado' | 'Entregado';

export interface Pedido {
  id: number;
  fecha: Date;
  items: ItemCarrito[];
  subtotal: number;
  envio: number;
  total: number;
  estado: EstadoPedido;
}
