export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface CategoriaAdmin extends Categoria {
  cantidad_productos: number;
}

export type NuevaCategoria = Pick<Categoria, 'nombre' | 'descripcion'>;

export type OrdenCategorias = 'nombre_asc' | 'nombre_desc' | 'productos_desc' | 'recientes';
