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

export class Producto {
  id!: number;
  nombre!: string;
  descripcion!: string;
  clasificacion!: Clasificacion;
  precio!: number;
  imagen!: string;
  destacado!: boolean;
  creado_en!: Date;
}

export type NuevoProducto = Pick<
  Producto,
  'nombre' | 'descripcion' | 'clasificacion' | 'precio' | 'imagen' | 'destacado'
>;
