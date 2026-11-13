import { CurrencyPipe } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../../../api/services/carrito/carrito.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';

@Component({
  selector: 'app-carrito',
  imports: [RouterLink, CurrencyPipe, ImagenFallbackDirective],
  templateUrl: './carrito.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './carrito.css',
})
export class Carrito {
  readonly carrito = inject(CarritoService);

  private readonly pedidos = inject(PedidosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);

  quitar(productoId: number, nombre: string): void {
    this.carrito.quitar(productoId);
    this.notificaciones.mostrar(`${nombre} se quitó del carrito.`, 'info');
  }

  realizarPedido(): void {
    if (this.carrito.items().length === 0) {
      return;
    }

    const pedido = this.pedidos.crear(
      this.carrito.items(),
      this.carrito.subtotal(),
      this.carrito.envio(),
    );
    this.carrito.vaciar();
    this.notificaciones.mostrar(`Pedido #${pedido.id} confirmado. ¡Gracias por tu compra!`);
    this.router.navigate(['/carrito/pedido']);
  }
}
