import type { Variante } from './producto.model.js';

export type ProductoCarrito = {
  id: number;
  nombre: string;
  descripcion: string;
  categoria_id: number;
  clasificacion: string;
  precio: number;
  imagen: string;
  destacado: boolean;
};

export class ItemCarrito {
  producto!: ProductoCarrito;
  variante!: Variante;
  cantidad!: number;
}

export type ItemCarritoFila = ProductoCarrito & {
  variante_id: number;
  talle: string;
  color: string;
  stock: number;
  cantidad: number;
};

export class CarritoResumen {
  items!: ItemCarrito[];
  cantidadTotal!: number;
  subtotal!: number;
  envio!: number;
  total!: number;
}
