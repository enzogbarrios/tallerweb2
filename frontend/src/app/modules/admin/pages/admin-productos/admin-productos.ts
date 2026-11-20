import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriasService } from '../../../../api/services/categorias/categorias.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { ProductosService } from '../../../../api/services/productos/productos.service';
import { leerError } from '../../../../api/utils/leer-error';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';
import { SoloNumerosDirective } from '../../../../shared/directives/solo-numeros.directive';
import {
  FiltroStock,
  nombreVariante,
  ORDENES_PRODUCTOS,
  OrdenProductos,
  Producto,
} from '../../../../shared/models/producto.model';
import { ordenarProductos } from '../../../../shared/utils/ordenar-productos';

const LIMITES = [10, 20, 50];
const LIMITE_POR_DEFECTO = 10;
const ORDEN_POR_DEFECTO: OrdenProductos = 'recientes';

@Component({
  selector: 'app-admin-productos',
  imports: [RouterLink, CurrencyPipe, ImagenFallbackDirective, SoloNumerosDirective],
  templateUrl: './admin-productos.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminProductos {
  private readonly productosService = inject(ProductosService);
  private readonly notificaciones = inject(NotificacionesService);

  readonly categorias = inject(CategoriasService).categorias;
  readonly ordenes = ORDENES_PRODUCTOS;
  readonly limites = LIMITES;

  readonly busqueda = signal('');
  readonly categoriaId = signal<number | undefined>(undefined);
  readonly destacado = signal<boolean | undefined>(undefined);
  readonly stock = signal<FiltroStock | undefined>(undefined);
  readonly precioMin = signal<number | undefined>(undefined);
  readonly precioMax = signal<number | undefined>(undefined);
  readonly orden = signal<OrdenProductos>(ORDEN_POR_DEFECTO);
  readonly pagina = signal(1);
  readonly limite = signal(LIMITE_POR_DEFECTO);

  readonly confirmandoId = signal<number | null>(null);

  readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const categoriaId = this.categoriaId();
    const destacado = this.destacado();
    const stock = this.stock();
    const precioMin = this.precioMin();
    const precioMax = this.precioMax();

    const coincidentes = this.productosService.productos().filter((producto) => {
      const coincideTexto =
        !texto ||
        producto.nombre.toLowerCase().includes(texto) ||
        producto.descripcion.toLowerCase().includes(texto);
      const coincideCategoria = categoriaId === undefined || producto.categoria_id === categoriaId;
      const coincideDestacado = destacado === undefined || producto.destacado === destacado;
      const coincidePrecio =
        (precioMin === undefined || producto.precio >= precioMin) &&
        (precioMax === undefined || producto.precio <= precioMax);
      const coincideStock =
        stock === undefined ||
        (stock === 'con_stock' ? producto.stock > 0 : producto.stock === 0);

      return (
        coincideTexto && coincideCategoria && coincideDestacado && coincidePrecio && coincideStock
      );
    });

    return ordenarProductos(coincidentes, this.orden());
  });

  readonly total = computed(() => this.filtrados().length);
  readonly totalPaginas = computed(() => Math.ceil(this.total() / this.limite()));
  readonly paginaActual = computed(() =>
    Math.min(this.pagina(), Math.max(1, this.totalPaginas())),
  );
  readonly productos = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.limite();
    return this.filtrados().slice(inicio, inicio + this.limite());
  });

  readonly hayFiltros = computed(() => {
    return (
      !!this.busqueda().trim() ||
      this.categoriaId() !== undefined ||
      this.destacado() !== undefined ||
      this.stock() !== undefined ||
      this.precioMin() !== undefined ||
      this.precioMax() !== undefined ||
      this.orden() !== ORDEN_POR_DEFECTO
    );
  });

  readonly paginasVisibles = computed<Array<number | null>>(() => {
    const actual = this.paginaActual();
    const ultima = this.totalPaginas();
    const visibles: Array<number | null> = [];

    for (let numero = 1; numero <= ultima; numero++) {
      if (numero === 1 || numero === ultima || Math.abs(numero - actual) <= 1) {
        visibles.push(numero);
      } else if (visibles[visibles.length - 1] !== null) {
        visibles.push(null);
      }
    }
    return visibles;
  });

  buscar(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
    this.pagina.set(1);
  }

  filtrarCategoria(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.categoriaId.set(valor === '' ? undefined : Number(valor));
    this.pagina.set(1);
  }

  filtrarDestacado(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.destacado.set(valor === '' ? undefined : valor === 'true');
    this.pagina.set(1);
  }

  filtrarStock(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.stock.set(valor === '' ? undefined : (valor as FiltroStock));
    this.pagina.set(1);
  }

  detalleStock(producto: Producto): string {
    return producto.variantes
      .map((variante) => `${nombreVariante(variante) || 'Única'}: ${variante.stock}`)
      .join(' · ');
  }

  filtrarPrecio(campo: 'precio_min' | 'precio_max', event: Event): void {
    const input = event.target as HTMLInputElement;
    const numero = input.value === '' ? undefined : Number(input.value);
    const valido = numero === undefined || (Number.isInteger(numero) && numero >= 0);
    const valorActual = () => (campo === 'precio_min' ? this.precioMin() : this.precioMax());

    if (!valido) {
      this.notificaciones.mostrar('El precio tiene que ser un número entero positivo.', 'error');
      input.value = String(valorActual() ?? '');
      return;
    }

    const min = campo === 'precio_min' ? numero : this.precioMin();
    const max = campo === 'precio_max' ? numero : this.precioMax();
    if (min !== undefined && max !== undefined && min > max) {
      this.notificaciones.mostrar('El precio mínimo no puede ser mayor al máximo.', 'error');
      input.value = String(valorActual() ?? '');
      return;
    }

    if (campo === 'precio_min') {
      this.precioMin.set(numero);
    } else {
      this.precioMax.set(numero);
    }
    this.pagina.set(1);
  }

  ordenar(event: Event): void {
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
    this.destacado.set(undefined);
    this.stock.set(undefined);
    this.precioMin.set(undefined);
    this.precioMax.set(undefined);
    this.orden.set(ORDEN_POR_DEFECTO);
    this.pagina.set(1);
  }

  pedirConfirmacion(id: number): void {
    this.confirmandoId.set(id);
  }

  cancelar(): void {
    this.confirmandoId.set(null);
  }

  eliminar(producto: Producto): void {
    this.productosService.eliminar(producto.id).subscribe({
      next: () => {
        this.confirmandoId.set(null);
        this.notificaciones.mostrar(`"${producto.nombre}" se eliminó.`, 'info');
      },
      error: (error) => {
        this.confirmandoId.set(null);
        this.notificaciones.mostrar(leerError(error).mensaje, 'error');
      },
    });
  }
}
