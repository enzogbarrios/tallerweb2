export class Variante {
  id!: number;
  talle!: string;
  color!: string;
  stock!: number;
}

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
  variantes!: Variante[];
  stock!: number;
}

export type NuevaVariante = {
  id?: number | undefined;
  talle: string;
  color: string;
  stock: number;
};

export type NuevoProducto = Pick<
  Producto,
  'nombre' | 'descripcion' | 'categoria_id' | 'precio' | 'imagen' | 'destacado'
> & { variantes: NuevaVariante[] };
