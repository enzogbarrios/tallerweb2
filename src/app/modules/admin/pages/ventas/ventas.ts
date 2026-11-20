import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';
import { leerError } from '../../../../api/utils/leer-error';
import { EstadoPedido, Pedido } from '../../../../shared/models/pedido.model';

// las mismas transiciones que valida el back
const SIGUIENTES_ESTADOS: Record<EstadoPedido, EstadoPedido[]> = {
  Confirmado: ['En preparación', 'Cancelado'],
  'En preparación': ['Enviado'],
  Enviado: ['Entregado'],
  Entregado: [],
  Cancelado: [],
};

@Component({
  selector: 'app-ventas',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './ventas.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Ventas implements OnInit {
  private readonly pedidosService = inject(PedidosService);
  private readonly notificaciones = inject(NotificacionesService);

  // el back devuelve todas las ventas (con comprador) ordenadas de la mas nueva a la mas vieja.
  readonly ventas = this.pedidosService.ventas;

  // pedido que su cambio de estado esta viajando al back
  readonly actualizandoId = signal<number | null>(null);

  // pedido que espera confirmacion para cancelarse
  readonly confirmandoCancelacion = signal<number | null>(null);

  readonly totalFacturado = computed(() =>
    this.ventas().reduce((acumulado, venta) => acumulado + venta.total, 0),
  );

  ngOnInit(): void {
    this.pedidosService.listarTodos().subscribe();
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
      next: () => {
        this.actualizandoId.set(null);
        this.notificaciones.mostrar(`El pedido #${venta.id} pasó a "${estado}".`);
      },
      error: (error) => {
        this.actualizandoId.set(null);
        this.notificaciones.mostrar(leerError(error).mensaje, 'error');
      },
    });
  }
}
