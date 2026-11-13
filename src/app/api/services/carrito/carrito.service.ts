import { computed, Injectable, signal } from '@angular/core';
import { ItemCarrito } from '../../../shared/models/carrito.model';
import { Producto } from '../../../shared/models/producto.model';

@Injectable({
  providedIn: 'root',
})
export class CarritoService {
  private readonly itemsState = signal<ItemCarrito[]>([]);

  readonly items = this.itemsState.asReadonly();

  readonly cantidadTotal = computed(() =>
    this.items().reduce((total, item) => total + item.cantidad, 0),
  );

  readonly subtotal = computed(() =>
    this.items().reduce((total, item) => total + item.producto.precio * item.cantidad, 0),
  );

  readonly envio = computed(() => {
    if (this.items().length === 0) {
      return 0;
    }

    return this.subtotal() >= 50000 ? 0 : 4500;
  });

  readonly total = computed(() => this.subtotal() + this.envio());

  agregar(producto: Producto, cantidad = 1): void {
    if (cantidad <= 0) {
      return;
    }

    this.itemsState.update((items) => {
      const existente = items.find((item) => item.producto.id === producto.id);

      if (existente) {
        return items.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item,
        );
      }

      return [...items, { producto, cantidad }];
    });
  }

  cambiarCantidad(productoId: number, cantidad: number): void {
    if (cantidad <= 0) {
      this.quitar(productoId);
      return;
    }

    this.itemsState.update((items) =>
      items.map((item) =>
        item.producto.id === productoId ? { ...item, cantidad } : item,
      ),
    );
  }

  quitar(productoId: number): void {
    this.itemsState.update((items) =>
      items.filter((item) => item.producto.id !== productoId),
    );
  }

  vaciar(): void {
    this.itemsState.set([]);
  }
}
