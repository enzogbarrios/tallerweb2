import { Producto, Variante } from './producto.model';

export interface ItemCarrito {
  producto: Producto;
  variante: Variante;
  cantidad: number;
}

export interface CarritoResumen {
  items: ItemCarrito[];
  cantidadTotal: number;
  subtotal: number;
  envio: number;
  total: number;
}
