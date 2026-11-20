export const CLASIFICACIONES = [
  'Remeras',
  'Jeans',
  'Bermudas',
  'Shorts',
  'Sweaters',
  'Camisas',
  'Buzos',
  'Camperas',
  'Accesorios',
  'Polos',
] as const;

export type Clasificacion = (typeof CLASIFICACIONES)[number];

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  clasificacion: Clasificacion;
  precio: number;
  imagen: string;
  destacado: boolean;
}

export interface NuevoProducto extends Omit<Producto, 'id' | 'imagen'> {
  imagen: File | null;
}
