import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { CarritoService } from '../../../../api/services/carrito/carrito.service';
import { CategoriasService } from '../../../../api/services/categorias/categorias.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { ProductosService } from '../../../../api/services/productos/productos.service';
import {
  ORDENES_PRODUCTOS,
  OrdenProductos,
  Producto,
} from '../../../../shared/models/producto.model';
import { agregarAlCarrito } from '../../../../shared/utils/agregar-al-carrito';
import { ordenarProductos } from '../../../../shared/utils/ordenar-productos';
import { paginasVisibles, slicePagina } from '../../../../shared/utils/paginacion';
import { ProductoCard } from '../../components/producto-card/producto-card';

const LIMITES = [8, 12, 24];
const LIMITE_POR_DEFECTO = 12;

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

  readonly categorias = this.categoriasService.categorias;
  readonly ordenes = ORDENES_PRODUCTOS;
  readonly limites = LIMITES;

  readonly busqueda = signal('');
  readonly categoriaId = signal<number | undefined>(undefined);
  readonly orden = signal<OrdenProductos>('recientes');
  readonly pagina = signal(1);
  readonly limite = signal(LIMITE_POR_DEFECTO);

  readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const categoriaId = this.categoriaId();

    const coincidentes = this.productosService.productos().filter((producto) => {
      const coincideTexto =
        !texto ||
        producto.nombre.toLowerCase().includes(texto) ||
        producto.descripcion.toLowerCase().includes(texto);
      const coincideCategoria = categoriaId === undefined || producto.categoria_id === categoriaId;
      return coincideTexto && coincideCategoria;
    });

    return ordenarProductos(coincidentes, this.orden());
  });

  readonly total = computed(() => this.filtrados().length);
  readonly totalPaginas = computed(() => Math.ceil(this.total() / this.limite()));

  readonly paginaActual = computed(() =>
    Math.min(this.pagina(), Math.max(1, this.totalPaginas())),
  );

  readonly productos = computed(() =>
    slicePagina(this.filtrados(), this.paginaActual(), this.limite()),
  );

  readonly hayFiltros = computed(() => !!this.busqueda().trim() || this.categoriaId() !== undefined);

  readonly paginasVisibles = computed(() =>
    paginasVisibles(this.paginaActual(), this.totalPaginas()),
  );

  buscar(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
    this.pagina.set(1);
  }

  filtrar(categoriaId: number | undefined): void {
    this.categoriaId.set(categoriaId);
    this.pagina.set(1);
  }

  ordenarPor(event: Event): void {
    this.orden.set((event.target as HTMLSelectElement).value as OrdenProductos);
    this.pagina.set(1);
  }

  cambiarLimite(event: Event): void {
    this.limite.set(Number((event.target as HTMLSelectElement).value));
    this.pagina.set(1);
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.pagina.set(pagina);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.categoriaId.set(undefined);
    this.pagina.set(1);
  }

  agregarAlCarrito(producto: Producto): void {
    const variante = producto.variantes[0];
    if (!variante) return;

    agregarAlCarrito(this.auth, this.router, this.carrito, this.notificaciones, producto, variante);
  }
}
