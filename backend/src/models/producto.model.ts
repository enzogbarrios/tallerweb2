export class Producto {
  id!: number;
  nombre!: string;
  descripcion!: string;
  categoria_id!: number;
  clasificacion!: string;
  precio!: number;
  imagen!: string;
  destacado!: boolean;
  creado_en!: Date;
}

export type NuevoProducto = Pick<
  Producto,
  'nombre' | 'descripcion' | 'categoria_id' | 'precio' | 'imagen' | 'destacado'
>;
