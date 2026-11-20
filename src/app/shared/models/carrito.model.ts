import { Producto } from './producto.model';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

export interface CarritoResumen {
  items: ItemCarrito[];
  cantidadTotal: number;
  subtotal: number;
  envio: number;
  total: number;
}
