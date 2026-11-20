export type Clasificacion = string;

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  categoria_id: number;
  clasificacion: Clasificacion;
  precio: number;
  imagen: string;
  destacado: boolean;
}

export interface NuevoProducto extends Omit<Producto, 'id' | 'imagen' | 'clasificacion'> {
  imagen: File | null;
}
