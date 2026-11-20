import { CurrencyPipe } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../../../api/services/carrito/carrito.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { leerError } from '../../../../api/utils/leer-error';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';

@Component({
  selector: 'app-carrito',
  imports: [RouterLink, CurrencyPipe, ImagenFallbackDirective],
  templateUrl: './carrito.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Carrito {
  readonly carrito = inject(CarritoService);

  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);

  cambiarCantidad(productoId: number, cantidad: number): void {
    this.carrito.cambiarCantidad(productoId, cantidad).subscribe({
      error: (error) => this.notificaciones.mostrar(leerError(error).mensaje, 'error'),
    });
  }

  quitar(productoId: number, nombre: string): void {
    this.carrito.quitar(productoId).subscribe({
      next: () => this.notificaciones.mostrar(`${nombre} se quitó del carrito.`, 'info'),
      error: (error) => this.notificaciones.mostrar(leerError(error).mensaje, 'error'),
    });
  }

  realizarPedido(): void {
    if (this.carrito.items().length === 0) {
      return;
    }

    this.router.navigate(['/carrito/checkout']);
  }
}
