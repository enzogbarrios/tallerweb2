import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../../../api/services/carrito/carrito.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { leerError } from '../../../../api/utils/leer-error';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';
import { nombreVariante } from '../../../../shared/models/producto.model';

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

  readonly nombreVariante = nombreVariante;

  readonly faltaStock = computed(() =>
    this.carrito.items().some((item) => item.cantidad > item.variante.stock),
  );

  cambiarCantidad(varianteId: number, cantidad: number): void {
    this.carrito.cambiarCantidad(varianteId, cantidad).subscribe({
      error: (error) => this.notificaciones.mostrar(leerError(error).mensaje, 'error'),
    });
  }

  quitar(varianteId: number, nombre: string): void {
    this.carrito.quitar(varianteId).subscribe({
      next: () => this.notificaciones.mostrar(`${nombre} se quitó del carrito.`, 'info'),
      error: (error) => this.notificaciones.mostrar(leerError(error).mensaje, 'error'),
    });
  }

  realizarPedido(): void {
    if (this.carrito.items().length === 0) {
      return;
    }

    if (this.faltaStock()) {
      this.notificaciones.mostrar('Hay productos sin stock suficiente. Ajustá tu carrito.', 'error');
      return;
    }

    this.router.navigate(['/carrito/checkout']);
  }
}
