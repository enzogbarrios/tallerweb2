import { computed, Injectable, signal } from '@angular/core';
import { ItemCarrito } from '../../../shared/models/carrito.model';
import { Pedido } from '../../../shared/models/pedido.model';

@Injectable({
  providedIn: 'root',
})
export class PedidosService {
  private readonly pedidosState = signal<Pedido[]>([]);

  private siguienteId = 1001;

  readonly pedidos = this.pedidosState.asReadonly();

  readonly ultimoPedido = computed(() => {
    const pedidos = this.pedidos();
    return pedidos.length > 0 ? pedidos[pedidos.length - 1] : null;
  });

  crear(items: ItemCarrito[], subtotal: number, envio: number): Pedido {
    const pedido: Pedido = {
      id: this.siguienteId++,
      fecha: new Date(),
      items: items.map((item) => ({ ...item })),
      subtotal,
      envio,
      total: subtotal + envio,
      estado: 'Confirmado',
    };

    this.pedidosState.update((pedidos) => [...pedidos, pedido]);
    return pedido;
  }
}
