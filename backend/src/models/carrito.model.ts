import type { Producto } from './producto.model.js';

export class ItemCarrito {
  producto!: Producto;
  cantidad!: number;
}

// fila que devuelve el JOIN entre carrito_items y productos
export type ItemCarritoFila = Producto & { cantidad: number };

export class CarritoResumen {
  items!: ItemCarrito[];
  cantidadTotal!: number;
  subtotal!: number;
  envio!: number;
  total!: number;
}
