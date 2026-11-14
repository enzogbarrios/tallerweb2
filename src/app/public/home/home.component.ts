import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../api/services/carrito/carrito.service';
import { NotificacionesService } from '../../api/services/notificaciones/notificaciones.service';
import { ProductosService } from '../../api/services/productos/productos.service';
import { ProductoCard } from '../../modules/productos/components/producto-card/producto-card';
import { ImagenFallbackDirective } from '../../shared/directives/imagen-fallback.directive';
import { Producto } from '../../shared/models/producto.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductoCard],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class HomeComponent {
  private readonly productosService = inject(ProductosService);
  private readonly carrito = inject(CarritoService);
  private readonly notificaciones = inject(NotificacionesService);

  readonly destacados = computed(() =>
    this.productosService
      .productos()
      .filter((producto) => producto.destacado)
      .slice(0, 4),
  );

  readonly totalProductos = computed(() => this.productosService.productos().length);

  agregarAlCarrito(producto: Producto): void {
    this.carrito.agregar(producto);
    this.notificaciones.mostrar(`${producto.nombre} se agregó al carrito.`);
  }
}
