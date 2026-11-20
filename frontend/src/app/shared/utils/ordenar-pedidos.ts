import { OrdenVentas, Pedido } from '../models/pedido.model';

export function ordenarPedidos(items: Pedido[], orden: OrdenVentas): Pedido[] {
  const copia = [...items];
  switch (orden) {
    case 'antiguos':
      return copia.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id);
    case 'total_desc':
      return copia.sort((a, b) => b.total - a.total || b.id - a.id);
    case 'total_asc':
      return copia.sort((a, b) => a.total - b.total || a.id - b.id);
    default:
      return copia.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
  }
}
