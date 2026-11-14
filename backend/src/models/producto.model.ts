export type Clasificacion =
  | 'Remeras'
  | 'Jeans'
  | 'Bermudas'
  | 'Shorts'
  | 'Sweaters'
  | 'Camisas'
  | 'Buzos'
  | 'Camperas'
  | 'Accesorios'
  | 'Polos';

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
