import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';

@Component({
  selector: 'app-ventas',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './ventas.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Ventas {
  private readonly pedidos = inject(PedidosService);

  // Las más recientes primero.
  readonly ventas = computed(() => [...this.pedidos.pedidos()].reverse());

  readonly totalFacturado = computed(() =>
    this.ventas().reduce((acumulado, venta) => acumulado + venta.total, 0),
  );
}
