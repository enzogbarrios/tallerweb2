import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../../../api/services/carrito/carrito.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { ProductosService } from '../../../../api/services/productos/productos.service';
import { CLASIFICACIONES, Clasificacion, Producto } from '../../../../shared/models/producto.model';
import { ProductoCard } from '../../components/producto-card/producto-card';

@Component({
  selector: 'app-list-productos',
  imports: [RouterLink, ProductoCard],
  templateUrl: './list-productos.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ListProductos {
  private readonly productosService = inject(ProductosService);
  private readonly carrito = inject(CarritoService);
  private readonly notificaciones = inject(NotificacionesService);

  readonly clasificaciones: Array<Clasificacion | 'Todas'> = ['Todas', ...CLASIFICACIONES];

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
    this.carrito.agregar(producto);
    this.notificaciones.mostrar(`${producto.nombre} se agregó al carrito.`);
  }
}
