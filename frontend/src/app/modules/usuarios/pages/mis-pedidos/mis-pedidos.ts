import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
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
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';
import { leerError } from '../../../../api/utils/leer-error';
import { CampoFecha } from '../../../../shared/components/campo-fecha/campo-fecha';
import { EstadoPedidoBadge } from '../../../../shared/components/estado-pedido/estado-pedido';
import { Pagina } from '../../../../shared/models/pagina.model';
import {
  ESTADOS_PEDIDO,
  EstadoPedido,
  FiltrosMisPedidos,
  ORDENES_VENTAS,
  OrdenVentas,
  Pedido,
} from '../../../../shared/models/pedido.model';
import { nombreVariante } from '../../../../shared/models/producto.model';

const LIMITES = [5, 10, 20] as const;
const LIMITE_POR_DEFECTO = 10;
const ORDEN_POR_DEFECTO: OrdenVentas = 'recientes';

const ESPERA_BUSQUEDA_MS = 400;

const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

@Component({
  selector: 'app-mis-pedidos',
  imports: [RouterLink, CurrencyPipe, DatePipe, CampoFecha, EstadoPedidoBadge],
  templateUrl: './mis-pedidos.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class MisPedidos implements OnInit {
  readonly nombreVariante = nombreVariante;

  private readonly pedidosService = inject(PedidosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly estados: Array<EstadoPedido | 'Todos'> = ['Todos', ...ESTADOS_PEDIDO];
  readonly limites = LIMITES;
  readonly ordenes: Array<{ valor: OrdenVentas; texto: string }> = [
    { valor: 'recientes', texto: 'Más recientes' },
    { valor: 'antiguos', texto: 'Más antiguos' },
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

  private readonly filtros = computed<FiltrosMisPedidos>(() => ({
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

  readonly resultado = signal<Pagina<Pedido> | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly pedidos = computed(() => this.resultado()?.items ?? []);
  readonly total = computed(() => this.resultado()?.total ?? 0);
  readonly paginas = computed(() => this.resultado()?.paginas ?? 0);

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
          this.pedidosService.listar(filtros).pipe(
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

  urlActual(): string {
    return this.router.url;
  }

  verDetalle(id: number): void {
    this.router.navigate(['/mis-pedidos', id], { state: { volverA: this.router.url } });
  }

  private leerFiltrosDeUrl(params: ParamMap): FiltrosMisPedidos {
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

  private escribirFiltrosEnUrl(filtros: FiltrosMisPedidos): void {
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
