export type Clasificacion = string;

export interface Variante {
  id: number;
  talle: string;
  color: string;
  stock: number;
}

export interface NuevaVariante {
  id?: number;
  talle: string;
  color: string;
  stock: number;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  categoria_id: number;
  clasificacion: Clasificacion;
  precio: number;
  imagen: string;
  destacado: boolean;
  variantes: Variante[];
  stock: number;
}

export interface NuevoProducto
  extends Omit<Producto, 'id' | 'imagen' | 'clasificacion' | 'variantes' | 'stock'> {
  imagen: File | null;
  variantes: NuevaVariante[];
}

export function nombreVariante(variante: Pick<Variante, 'talle' | 'color'>): string {
  return [variante.talle, variante.color].filter(Boolean).join(' / ');
}

export function tieneVariantes(producto: Producto): boolean {
  return producto.variantes.length > 1 || producto.variantes.some((v) => nombreVariante(v) !== '');
}

export const ORDENES_PRODUCTOS = [
  { valor: 'recientes', etiqueta: 'Más recientes' },
  { valor: 'nombre_asc', etiqueta: 'Nombre (A-Z)' },
  { valor: 'nombre_desc', etiqueta: 'Nombre (Z-A)' },
  { valor: 'precio_asc', etiqueta: 'Menor precio' },
  { valor: 'precio_desc', etiqueta: 'Mayor precio' },
  { valor: 'stock_asc', etiqueta: 'Menos stock' },
  { valor: 'stock_desc', etiqueta: 'Más stock' },
] as const;

export type FiltroStock = 'con_stock' | 'sin_stock';

export type OrdenProductos = (typeof ORDENES_PRODUCTOS)[number]['valor'];
