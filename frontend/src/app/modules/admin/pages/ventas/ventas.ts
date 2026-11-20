import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';
import { leerError } from '../../../../api/utils/leer-error';
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

@Component({
  selector: 'app-ventas',
  imports: [RouterLink, CurrencyPipe, DatePipe, CampoFecha, EstadoPedidoBadge],
  templateUrl: './ventas.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Ventas {
  readonly nombreVariante = nombreVariante;

  private readonly pedidosService = inject(PedidosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly auth = inject(AuthService);

  constructor() {
    const usuario = this.auth.usuarioActual();
    if (usuario && this.auth.esAdmin()) {
      this.pedidosService.cargarTodos(usuario.id).subscribe();
    }
  }

  readonly estados: Array<EstadoPedido | 'Todos'> = ['Todos', ...ESTADOS_PEDIDO];
  readonly limites = LIMITES;
  readonly ordenes: Array<{ valor: OrdenVentas; texto: string }> = [
    { valor: 'recientes', texto: 'Más recientes' },
    { valor: 'antiguos', texto: 'Más antiguas' },
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

    const coincidentes = this.pedidosService.ventas().filter((venta) => {
      const fecha = fechaLocal(venta.fecha);
      const coincideEstado = estado === null || venta.estado === estado;
      const coincideFecha = (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
      const comprador = venta.comprador;
      const coincideTexto =
        !texto ||
        (numero !== null && venta.id === numero) ||
        (numero === null &&
          comprador !== null &&
          [
            comprador.nombre,
            comprador.apellido,
            comprador.email,
            `${comprador.nombre} ${comprador.apellido}`,
          ].some((valor) => valor.toLowerCase().includes(texto)));

      return coincideEstado && coincideFecha && coincideTexto;
    });

    return ordenarPedidos(coincidentes, this.orden());
  });

  readonly resumen = computed(() => {
    const contables = this.filtrados().filter((venta) => venta.estado !== 'Cancelado');
    return {
      cantidad: contables.length,
      facturado: contables.reduce((total, venta) => total + venta.total, 0),
    };
  });

  readonly total = computed(() => this.filtrados().length);
  readonly totalPaginas = computed(() => Math.ceil(this.total() / this.limite()));
  readonly paginaActual = computed(() =>
    Math.min(this.pagina(), Math.max(1, this.totalPaginas())),
  );

  readonly ventas = computed(() => {
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

  // pedido que su cambio de estado esta viajando al back
  readonly actualizandoId = signal<number | null>(null);

  // pedido que espera confirmacion para cancelarse
  readonly confirmandoCancelacion = signal<number | null>(null);

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
      },
      error: (error) => {
        this.actualizandoId.set(null);
        this.notificaciones.mostrar(leerError(error).mensaje, 'error');
      },
    });
  }
}
