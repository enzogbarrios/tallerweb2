import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { ProductosService } from '../../../../api/services/productos/productos.service';
import { leerError } from '../../../../api/utils/leer-error';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';
import { SoloNumerosDirective } from '../../../../shared/directives/solo-numeros.directive';
import { Pagina } from '../../../../shared/models/pagina.model';
import { CategoriasService } from '../../../../api/services/categorias/categorias.service';
import {
  FiltroStock,
  FiltrosProductosAdmin,
  nombreVariante,
  ORDENES_PRODUCTOS,
  OrdenProductos,
  Producto,
} from '../../../../shared/models/producto.model';

const LIMITES = [10, 20, 50];
const LIMITE_POR_DEFECTO = 10;
const ORDEN_POR_DEFECTO: OrdenProductos = 'recientes';

function enteroDeUrl(valor: string | null, minimo: number): number | undefined {
  if (valor === null || valor.trim() === '') return undefined;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= minimo ? numero : undefined;
}

function filtrosDesdeUrl(params: ParamMap): FiltrosProductosAdmin {
  const destacado = params.get('destacado');
  const stock = params.get('stock');
  const orden = params.get('orden');
  const limite = enteroDeUrl(params.get('limite'), 1);

  return {
    pagina: enteroDeUrl(params.get('pagina'), 1) ?? 1,
    limite: limite !== undefined && LIMITES.includes(limite) ? limite : LIMITE_POR_DEFECTO,
    q: params.get('q')?.trim() || undefined,
    categoria_id: enteroDeUrl(params.get('categoria_id'), 1),
    destacado: destacado === 'true' ? true : destacado === 'false' ? false : undefined,
    precio_min: enteroDeUrl(params.get('precio_min'), 0),
    precio_max: enteroDeUrl(params.get('precio_max'), 0),
    stock: stock === 'con_stock' || stock === 'sin_stock' ? stock : undefined,
    orden: ORDENES_PRODUCTOS.find((item) => item.valor === orden)?.valor ?? ORDEN_POR_DEFECTO,
  };
}

@Component({
  selector: 'app-admin-productos',
  imports: [RouterLink, CurrencyPipe, ImagenFallbackDirective, SoloNumerosDirective],
  templateUrl: './admin-productos.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminProductos implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly categorias = inject(CategoriasService).categorias;
  readonly ordenes = ORDENES_PRODUCTOS;
  readonly limites = LIMITES;

  readonly filtros = signal<FiltrosProductosAdmin>(
    filtrosDesdeUrl(this.route.snapshot.queryParamMap),
  );

  readonly busqueda = signal(this.filtros().q ?? '');

  readonly resultado = signal<Pagina<Producto> | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  /** Id del producto que está esperando confirmación para eliminarse. */
  readonly confirmandoId = signal<number | null>(null);

  readonly productos = computed(() => this.resultado()?.items ?? []);
  readonly total = computed(() => this.resultado()?.total ?? 0);
  readonly paginaActual = computed(() => this.resultado()?.pagina ?? 1);
  readonly totalPaginas = computed(() => this.resultado()?.paginas ?? 0);

  readonly hayFiltros = computed(() => {
    const filtros = this.filtros();
    return (
      !!filtros.q ||
      filtros.categoria_id !== undefined ||
      filtros.destacado !== undefined ||
      filtros.precio_min !== undefined ||
      filtros.precio_max !== undefined ||
      filtros.stock !== undefined ||
      filtros.orden !== ORDEN_POR_DEFECTO
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

  private readonly busqueda$ = new Subject<string>();
  private readonly recargar$ = new Subject<void>();

  private busquedaEnviada = this.busqueda();

  ngOnInit(): void {
    this.busqueda$
      .pipe(
        map((texto) => texto.trim()),
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((texto) => {
        this.busquedaEnviada = texto;
        if (texto !== (this.filtros().q ?? '')) {
          this.actualizarFiltros({ q: texto || undefined });
        }
      });

    const filtros$ = this.route.queryParamMap.pipe(
      map(filtrosDesdeUrl),
      tap((filtros) => {
        this.filtros.set(filtros);
        const q = filtros.q ?? '';
        if (q !== this.busquedaEnviada) {
          this.busquedaEnviada = q;
          this.busqueda.set(q);
          this.busqueda$.next(q);
        }
      }),
    );

    combineLatest([filtros$, this.recargar$.pipe(startWith(undefined))])
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
        }),
        switchMap(([filtros]) =>
          this.productosService.listarAdmin(filtros).pipe(
            catchError((error) => {
              const mensaje = leerError(error).mensaje;
              this.error.set(mensaje);
              this.notificaciones.mostrar(mensaje, 'error');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((pagina) => {
        this.cargando.set(false);
        if (!pagina) return;

        if (pagina.items.length === 0 && pagina.total > 0 && pagina.pagina > pagina.paginas) {
          this.actualizarFiltros({ pagina: pagina.paginas }, false);
          return;
        }
        this.resultado.set(pagina);
      });
  }

  buscar(event: Event): void {
    const texto = (event.target as HTMLInputElement).value;
    this.busqueda.set(texto);
    this.busqueda$.next(texto);
  }

  filtrarCategoria(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.actualizarFiltros({ categoria_id: valor === '' ? undefined : Number(valor) });
  }

  filtrarDestacado(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.actualizarFiltros({ destacado: valor === '' ? undefined : valor === 'true' });
  }

  filtrarStock(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.actualizarFiltros({ stock: valor === '' ? undefined : (valor as FiltroStock) });
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

    if (!valido) {
      this.notificaciones.mostrar('El precio tiene que ser un número entero positivo.', 'error');
      input.value = String(this.filtros()[campo] ?? '');
      return;
    }

    const cambio: FiltrosProductosAdmin =
      campo === 'precio_min' ? { precio_min: numero } : { precio_max: numero };
    const { precio_min, precio_max } = { ...this.filtros(), ...cambio };
    if (precio_min !== undefined && precio_max !== undefined && precio_min > precio_max) {
      this.notificaciones.mostrar('El precio mínimo no puede ser mayor al máximo.', 'error');
      input.value = String(this.filtros()[campo] ?? '');
      return;
    }

    this.actualizarFiltros(cambio);
  }

  ordenar(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value as OrdenProductos;
    this.actualizarFiltros({ orden: valor });
  }

  cambiarLimite(event: Event): void {
    const limite = Number((event.target as HTMLSelectElement).value);
    this.actualizarFiltros({ limite });
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || (this.totalPaginas() > 0 && pagina > this.totalPaginas())) return;
    this.actualizarFiltros({ pagina }, false);
  }

  limpiarFiltros(): void {
    const limite = this.filtros().limite;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { limite: limite === LIMITE_POR_DEFECTO ? null : limite },
    });
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
        this.recargar$.next();
      },
      error: (error) => {
        this.confirmandoId.set(null);
        this.notificaciones.mostrar(leerError(error).mensaje, 'error');
      },
    });
  }

  private actualizarFiltros(cambios: FiltrosProductosAdmin, volverAPrimera = true): void {
    const queryParams: Record<string, string | number | boolean | null> = {};

    for (const [clave, valor] of Object.entries(cambios)) {
      queryParams[clave] = valor ?? null;
    }
    if (volverAPrimera) queryParams['pagina'] = null;
    if (queryParams['pagina'] === 1) queryParams['pagina'] = null;
    if (queryParams['limite'] === LIMITE_POR_DEFECTO) queryParams['limite'] = null;
    if (queryParams['orden'] === ORDEN_POR_DEFECTO) queryParams['orden'] = null;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
