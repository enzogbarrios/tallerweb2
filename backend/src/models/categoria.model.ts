export class Categoria {
  id!: number;
  nombre!: string;
  descripcion!: string;
  creado_en!: Date;
}

export type CategoriaConCantidad = Categoria & { cantidad_productos: number };

export type NuevaCategoria = Pick<Categoria, 'nombre' | 'descripcion'>;
