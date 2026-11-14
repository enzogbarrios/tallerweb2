import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { ProductosService } from '../../../../api/services/productos/productos.service';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';
import { Producto } from '../../../../shared/models/producto.model';

@Component({
  selector: 'app-admin-productos',
  imports: [RouterLink, CurrencyPipe, ImagenFallbackDirective],
  templateUrl: './admin-productos.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminProductos {
  private readonly productosService = inject(ProductosService);
  private readonly notificaciones = inject(NotificacionesService);

  readonly productos = this.productosService.productos;

  /** Id del producto que está esperando confirmación para eliminarse. */
  readonly confirmandoId = signal<number | null>(null);

  pedirConfirmacion(id: number): void {
    this.confirmandoId.set(id);
  }

  cancelar(): void {
    this.confirmandoId.set(null);
  }

  eliminar(producto: Producto): void {
    this.productosService.eliminar(producto.id);
    this.confirmandoId.set(null);
    this.notificaciones.mostrar(`"${producto.nombre}" se eliminó.`, 'info');
  }
}
