import { OrdenProductos, Producto } from '../models/producto.model';

export function ordenarProductos(items: Producto[], orden: OrdenProductos): Producto[] {
  const copia = [...items];
  switch (orden) {
    case 'nombre_asc':
      return copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    case 'nombre_desc':
      return copia.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'));
    case 'precio_asc':
      return copia.sort((a, b) => a.precio - b.precio);
    case 'precio_desc':
      return copia.sort((a, b) => b.precio - a.precio);
    case 'stock_asc':
      return copia.sort((a, b) => a.stock - b.stock);
    case 'stock_desc':
      return copia.sort((a, b) => b.stock - a.stock);
    default:
      return copia.sort((a, b) => b.id - a.id);
  }
}
