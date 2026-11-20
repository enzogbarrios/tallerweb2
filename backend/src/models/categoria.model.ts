export class Categoria {
  id!: number;
  nombre!: string;
  descripcion!: string;
  creado_en!: Date;
}

export type NuevaCategoria = Pick<Categoria, 'nombre' | 'descripcion'>;
