import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { CarritoService } from '../../../../api/services/carrito/carrito.service';
import { CategoriasService } from '../../../../api/services/categorias/categorias.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { ProductosService } from '../../../../api/services/productos/productos.service';
import { Clasificacion, Producto } from '../../../../shared/models/producto.model';
import { agregarAlCarrito } from '../../../../shared/utils/agregar-al-carrito';
import { ProductoCard } from '../../components/producto-card/producto-card';

@Component({
  selector: 'app-list-productos',
  imports: [ProductoCard],
  templateUrl: './list-productos.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ListProductos {
  private readonly productosService = inject(ProductosService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly carrito = inject(CarritoService);
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);

  readonly clasificaciones = computed<Array<Clasificacion | 'Todas'>>(() => [
    'Todas',
    ...this.categoriasService.categorias().map((categoria) => categoria.nombre),
  ]);

  readonly busqueda = signal('');
  readonly clasificacionActiva = signal<Clasificacion | 'Todas'>('Todas');

  readonly productosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const clasificacion = this.clasificacionActiva();

    return this.productosService.productos().filter((producto) => {
      const coincideTexto =
        !texto ||
        producto.nombre.toLowerCase().includes(texto) ||
        producto.descripcion.toLowerCase().includes(texto);

      const coincideClasificacion =
        clasificacion === 'Todas' || producto.clasificacion === clasificacion;

      return coincideTexto && coincideClasificacion;
    });
  });

  readonly cantidadResultados = computed(() => this.productosFiltrados().length);

  buscar(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  filtrar(clasificacion: Clasificacion | 'Todas'): void {
    this.clasificacionActiva.set(clasificacion);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.clasificacionActiva.set('Todas');
  }

  agregarAlCarrito(producto: Producto): void {
    const variante = producto.variantes[0];
    if (!variante) return;

    agregarAlCarrito(this.auth, this.router, this.carrito, this.notificaciones, producto, variante);
  }
}
