import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../api/services/auth/auth.service';
import { CarritoService } from '../../api/services/carrito/carrito.service';
import { NotificacionesService } from '../../api/services/notificaciones/notificaciones.service';
import { ProductosService } from '../../api/services/productos/productos.service';
import { ProductoCard } from '../../modules/productos/components/producto-card/producto-card';
import { Producto } from '../../shared/models/producto.model';
import { agregarAlCarrito as agregarProductoAlCarrito } from '../../shared/utils/agregar-al-carrito';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductoCard],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class HomeComponent {
  private readonly productosService = inject(ProductosService);
  private readonly carrito = inject(CarritoService);
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);

  readonly destacados = computed(() =>
    this.productosService
      .productos()
      .filter((producto) => producto.destacado)
      .slice(0, 4),
  );

  agregarAlCarrito(producto: Producto): void {
    const variante = producto.variantes[0];
    if (!variante) return;

    agregarProductoAlCarrito(
      this.auth,
      this.router,
      this.carrito,
      this.notificaciones,
      producto,
      variante,
    );
  }
}
