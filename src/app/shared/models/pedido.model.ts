import { ItemCarrito } from './carrito.model';
import { Usuario } from './usuario.model';

export type EstadoPedido = 'Confirmado' | 'En preparación' | 'Enviado' | 'Entregado';

export type Comprador = Pick<Usuario, 'id' | 'nombre' | 'apellido' | 'email'>;

export interface Pedido {
  id: number;
  fecha: Date;
  comprador: Comprador | null;
  items: ItemCarrito[];
  subtotal: number;
  envio: number;
  total: number;
  estado: EstadoPedido;
}
