import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';
import { CampoFecha } from '../../../../shared/components/campo-fecha/campo-fecha';
import { EstadoPedidoBadge } from '../../../../shared/components/estado-pedido/estado-pedido';
import {
  ESTADOS_PEDIDO,
  EstadoPedido,
  ORDENES_VENTAS,
  OrdenVentas,
  Pedido,
} from '../../../../shared/models/pedido.model';
import { nombreVariante } from '../../../../shared/models/producto.model';
import { fechaLocal } from '../../../../shared/utils/fecha-local';
import { ordenarPedidos } from '../../../../shared/utils/ordenar-pedidos';

const LIMITES = [5, 10, 20] as const;
const LIMITE_POR_DEFECTO = 10;
const ORDEN_POR_DEFECTO: OrdenVentas = 'recientes';

@Component({
  selector: 'app-mis-pedidos',
  imports: [RouterLink, CurrencyPipe, DatePipe, CampoFecha, EstadoPedidoBadge],
  templateUrl: './mis-pedidos.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class MisPedidos {
  readonly nombreVariante = nombreVariante;

  private readonly pedidosService = inject(PedidosService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly estados: Array<EstadoPedido | 'Todos'> = ['Todos', ...ESTADOS_PEDIDO];
  readonly limites = LIMITES;
  readonly ordenes: Array<{ valor: OrdenVentas; texto: string }> = [
    { valor: 'recientes', texto: 'Más recientes' },
    { valor: 'antiguos', texto: 'Más antiguos' },
    { valor: 'total_desc', texto: 'Mayor total' },
    { valor: 'total_asc', texto: 'Menor total' },
  ];

  readonly busqueda = signal('');
  readonly estadoActivo = signal<EstadoPedido | null>(null);
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly orden = signal<OrdenVentas>(ORDEN_POR_DEFECTO);
  readonly pagina = signal(1);
  readonly limite = signal(LIMITE_POR_DEFECTO);

  constructor() {
    const usuario = this.auth.usuarioActual();
    if (usuario) {
      this.pedidosService.cargar(usuario.id).subscribe();
    }
  }

  readonly hayFiltros = computed(
    () =>
      this.estadoActivo() !== null ||
      this.busqueda().trim() !== '' ||
      this.desde() !== '' ||
      this.hasta() !== '',
  );

  readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const numero = /^#?\d{1,9}$/.test(texto) ? Number(texto.replace('#', '')) : null;
    const estado = this.estadoActivo();
    const desde = this.desde();
    const hasta = this.hasta();

    const coincidentes = this.pedidosService.pedidos().filter((pedido) => {
      const fecha = fechaLocal(pedido.fecha);
      const coincideEstado = estado === null || pedido.estado === estado;
      const coincideFecha = (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
      const coincideTexto =
        !texto ||
        (numero !== null && pedido.id === numero) ||
        (numero === null &&
          pedido.items.some((item) => item.producto.nombre.toLowerCase().includes(texto)));

      return coincideEstado && coincideFecha && coincideTexto;
    });

    return ordenarPedidos(coincidentes, this.orden());
  });

  readonly total = computed(() => this.filtrados().length);
  readonly totalPaginas = computed(() => Math.ceil(this.total() / this.limite()));
  readonly paginaActual = computed(() =>
    Math.min(this.pagina(), Math.max(1, this.totalPaginas())),
  );

  readonly pedidos = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.limite();
    return this.filtrados().slice(inicio, inicio + this.limite());
  });

  readonly desdeItem = computed(() =>
    this.total() === 0 ? 0 : (this.paginaActual() - 1) * this.limite() + 1,
  );
  readonly hastaItem = computed(() => Math.min(this.paginaActual() * this.limite(), this.total()));

  readonly numerosPagina = computed<Array<number | null>>(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
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

  filtrarEstado(estado: EstadoPedido | 'Todos'): void {
    this.estadoActivo.set(estado === 'Todos' ? null : estado);
    this.pagina.set(1);
  }

  buscar(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
    this.pagina.set(1);
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
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.pagina.set(pagina);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.estadoActivo.set(null);
    this.desde.set('');
    this.hasta.set('');
    this.pagina.set(1);
  }

  urlActual(): string {
    return this.router.url;
  }

  verDetalle(id: number): void {
    this.router.navigate(['/mis-pedidos', id], { state: { volverA: this.router.url } });
  }
}
