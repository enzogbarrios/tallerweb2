import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';
import { leerError } from '../../../../api/utils/leer-error';
import { CampoFecha } from '../../../../shared/components/campo-fecha/campo-fecha';
import { EstadoPedidoBadge } from '../../../../shared/components/estado-pedido/estado-pedido';
import {
  ESTADOS_PEDIDO,
  EstadoPedido,
  FiltrosVentas,
  ORDENES_VENTAS,
  OrdenVentas,
  PaginaVentas,
  Pedido,
} from '../../../../shared/models/pedido.model';
import { nombreVariante } from '../../../../shared/models/producto.model';

// las mismas transiciones que valida el back
const SIGUIENTES_ESTADOS: Record<EstadoPedido, EstadoPedido[]> = {
  Confirmado: ['En preparación', 'Cancelado'],
  'En preparación': ['Enviado'],
  Enviado: ['Entregado'],
  Entregado: [],
  Cancelado: [],
};

const LIMITES = [10, 20, 50] as const;
const LIMITE_POR_DEFECTO = 10;
const ORDEN_POR_DEFECTO: OrdenVentas = 'recientes';

const ESPERA_BUSQUEDA_MS = 400;

const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

@Component({
  selector: 'app-ventas',
  imports: [RouterLink, CurrencyPipe, DatePipe, CampoFecha, EstadoPedidoBadge],
  templateUrl: './ventas.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Ventas implements OnInit {
  readonly nombreVariante = nombreVariante;

  private readonly pedidosService = inject(PedidosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly estados: Array<EstadoPedido | 'Todos'> = ['Todos', ...ESTADOS_PEDIDO];
  readonly limites = LIMITES;
  readonly ordenes: Array<{ valor: OrdenVentas; texto: string }> = [
    { valor: 'recientes', texto: 'Más recientes' },
    { valor: 'antiguos', texto: 'Más antiguas' },
    { valor: 'total_desc', texto: 'Mayor total' },
    { valor: 'total_asc', texto: 'Menor total' },
  ];

  private readonly inicial = this.leerFiltrosDeUrl(this.route.snapshot.queryParamMap);

  readonly estadoActivo = signal<EstadoPedido | null>(this.inicial.estado);
  readonly textoBusqueda = signal(this.inicial.q);
  private readonly q = signal(this.inicial.q);
  readonly desde = signal(this.inicial.desde);
  readonly hasta = signal(this.inicial.hasta);
  readonly orden = signal<OrdenVentas>(this.inicial.orden);
  readonly limite = signal(this.inicial.limite);
  readonly pagina = signal(this.inicial.pagina);

  private readonly filtros = computed<FiltrosVentas>(() => ({
    pagina: this.pagina(),
    limite: this.limite(),
    estado: this.estadoActivo(),
    q: this.q(),
    desde: this.desde(),
    hasta: this.hasta(),
    orden: this.orden(),
  }));

  private readonly filtros$ = toObservable(this.filtros);

  readonly hayFiltros = computed(
    () =>
      this.estadoActivo() !== null ||
      this.textoBusqueda().trim() !== '' ||
      this.desde() !== '' ||
      this.hasta() !== '',
  );

  private readonly busqueda$ = new Subject<string>();
  private readonly recargar$ = new Subject<void>();

  readonly resultado = signal<PaginaVentas | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly ventas = computed(() => this.resultado()?.items ?? []);
  readonly total = computed(() => this.resultado()?.total ?? 0);
  readonly paginas = computed(() => this.resultado()?.paginas ?? 0);
  readonly resumen = computed(() => this.resultado()?.resumen ?? { cantidad: 0, facturado: 0 });

  readonly desdeItem = computed(() =>
    this.total() === 0 ? 0 : (this.pagina() - 1) * this.limite() + 1,
  );
  readonly hastaItem = computed(() => Math.min(this.pagina() * this.limite(), this.total()));

  readonly numerosPagina = computed<Array<number | null>>(() => {
    const total = this.paginas();
    const actual = this.pagina();
    const numeros: Array<number | null> = [];

    for (let n = 1; n <= total; n++) {
      const cerca = Math.abs(n - actual) <= 1;
      if (n === 1 || n === total || cerca) {
        numeros.push(n);
      } else if (numeros[numeros.length - 1] !== null) {
        numeros.push(null);
      }
    }
    return numeros;
  });

  // pedido que su cambio de estado esta viajando al back
  readonly actualizandoId = signal<number | null>(null);

  // pedido que espera confirmacion para cancelarse
  readonly confirmandoCancelacion = signal<number | null>(null);

  ngOnInit(): void {
    this.busqueda$
      .pipe(
        map((texto) => texto.trim()),
        debounceTime(ESPERA_BUSQUEDA_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((texto) => {
        this.q.set(texto);
        this.pagina.set(1);
      });

    merge(this.filtros$, this.recargar$.pipe(map(() => this.filtros())))
      .pipe(
        tap((filtros) => {
          this.cargando.set(true);
          this.error.set(null);
          this.escribirFiltrosEnUrl(filtros);
        }),
        switchMap((filtros) =>
          this.pedidosService.listarTodos(filtros).pipe(
            catchError((error) => {
              this.error.set(leerError(error).mensaje);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resultado) => {
        this.cargando.set(false);

        if (!resultado) {
          return;
        }

        if (
          resultado.items.length === 0 &&
          resultado.paginas > 0 &&
          this.pagina() > resultado.paginas
        ) {
          this.pagina.set(resultado.paginas);
          return;
        }

        this.resultado.set(resultado);
      });
  }

  filtrarEstado(estado: EstadoPedido | 'Todos'): void {
    this.estadoActivo.set(estado === 'Todos' ? null : estado);
    this.pagina.set(1);
  }

  buscar(event: Event): void {
    const texto = (event.target as HTMLInputElement).value;
    this.textoBusqueda.set(texto);
    this.busqueda$.next(texto);
  }

  cambiarDesde(fecha: string): void {
    this.desde.set(fecha);
    this.pagina.set(1);
  }

  cambiarHasta(fecha: string): void {
    this.hasta.set(fecha);
    this.pagina.set(1);
  }

  cambiarOrden(event: Event): void {
    this.orden.set((event.target as HTMLSelectElement).value as OrdenVentas);
    this.pagina.set(1);
  }

  cambiarLimite(event: Event): void {
    this.limite.set(Number((event.target as HTMLSelectElement).value));
    this.pagina.set(1);
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.paginas() || pagina === this.pagina()) {
      return;
    }
    this.pagina.set(pagina);
  }

  limpiarFiltros(): void {
    this.estadoActivo.set(null);
    this.textoBusqueda.set('');
    this.q.set('');
    this.busqueda$.next('');
    this.desde.set('');
    this.hasta.set('');
    this.pagina.set(1);
  }

  reintentar(): void {
    this.recargar$.next();
  }

  // proximo paso del circuito normal, sin contar la cancelacion
  siguienteEstado(estado: EstadoPedido): EstadoPedido | null {
    return SIGUIENTES_ESTADOS[estado].find((siguiente) => siguiente !== 'Cancelado') ?? null;
  }

  // solo se puede cancelar mientras el pedido esta Confirmado
  puedeCancelar(estado: EstadoPedido): boolean {
    return estado === 'Confirmado';
  }

  avanzar(venta: Pedido): void {
    const siguiente = this.siguienteEstado(venta.estado);

    if (siguiente) {
      this.cambiarEstado(venta, siguiente);
    }
  }

  pedirConfirmacion(id: number): void {
    this.confirmandoCancelacion.set(id);
  }

  cancelarConfirmacion(): void {
    this.confirmandoCancelacion.set(null);
  }

  confirmarCancelacion(venta: Pedido): void {
    this.cambiarEstado(venta, 'Cancelado');
  }

  private cambiarEstado(venta: Pedido, estado: EstadoPedido): void {
    if (this.actualizandoId() !== null) {
      return;
    }

    this.actualizandoId.set(venta.id);
    this.confirmandoCancelacion.set(null);

    this.pedidosService.cambiarEstado(venta.id, estado).subscribe({
      next: (pedido) => {
        this.actualizandoId.set(null);
        this.notificaciones.mostrar(`El pedido #${venta.id} pasó a "${pedido.estado}".`);

        const filtroEstado = this.estadoActivo();
        if ((filtroEstado && filtroEstado !== pedido.estado) || pedido.estado === 'Cancelado') {
          this.recargar$.next();
          return;
        }

        this.resultado.update((actual) =>
          actual
            ? {
                ...actual,
                items: actual.items.map((item) =>
                  item.id === venta.id ? { ...item, estado: pedido.estado } : item,
                ),
              }
            : actual,
        );
      },
      error: (error) => {
        this.actualizandoId.set(null);
        this.notificaciones.mostrar(leerError(error).mensaje, 'error');
      },
    });
  }

  private leerFiltrosDeUrl(params: ParamMap): FiltrosVentas {
    const estado = params.get('estado');
    const orden = params.get('orden');
    const desde = params.get('desde') ?? '';
    const hasta = params.get('hasta') ?? '';
    const pagina = Number(params.get('pagina'));
    const limite = Number(params.get('limite'));

    return {
      estado: ESTADOS_PEDIDO.find((valor) => valor === estado) ?? null,
      orden: ORDENES_VENTAS.find((valor) => valor === orden) ?? ORDEN_POR_DEFECTO,
      q: params.get('q') ?? '',
      desde: FECHA_VALIDA.test(desde) ? desde : '',
      hasta: FECHA_VALIDA.test(hasta) ? hasta : '',
      pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
      limite: LIMITES.find((valor) => valor === limite) ?? LIMITE_POR_DEFECTO,
    };
  }

  private escribirFiltrosEnUrl(filtros: FiltrosVentas): void {
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        estado: filtros.estado,
        q: filtros.q || null,
        desde: filtros.desde || null,
        hasta: filtros.hasta || null,
        orden: filtros.orden === ORDEN_POR_DEFECTO ? null : filtros.orden,
        limite: filtros.limite === LIMITE_POR_DEFECTO ? null : filtros.limite,
        pagina: filtros.pagina === 1 ? null : filtros.pagina,
      },
    });
  }
}
