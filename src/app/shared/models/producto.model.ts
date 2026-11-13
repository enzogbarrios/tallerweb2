export const CLASIFICACIONES = ['Tecnología', 'Indumentaria', 'Accesorios', 'Hogar'] as const;

export type Clasificacion = (typeof CLASIFICACIONES)[number];

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  clasificacion: Clasificacion;
  precio: number;
  imagen: string;
  destacado: boolean;
}

export type NuevoProducto = Omit<Producto, 'id'>;
