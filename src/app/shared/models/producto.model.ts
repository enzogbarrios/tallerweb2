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

export const ORDENES_PRODUCTOS = [
  { valor: 'recientes', etiqueta: 'Más recientes' },
  { valor: 'nombre_asc', etiqueta: 'Nombre (A-Z)' },
  { valor: 'nombre_desc', etiqueta: 'Nombre (Z-A)' },
  { valor: 'precio_asc', etiqueta: 'Menor precio' },
  { valor: 'precio_desc', etiqueta: 'Mayor precio' },
] as const;

export type OrdenProductos = (typeof ORDENES_PRODUCTOS)[number]['valor'];

export interface FiltrosProductosAdmin {
  pagina?: number;
  limite?: number;
  q?: string;
  categoria_id?: number;
  destacado?: boolean;
  precio_min?: number;
  precio_max?: number;
  orden?: OrdenProductos;
}
