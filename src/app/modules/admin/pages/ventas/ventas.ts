import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';

@Component({
  selector: 'app-ventas',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './ventas.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Ventas implements OnInit {
  private readonly pedidosService = inject(PedidosService);

  // el back devuelve todas las ventas (con comprador) ordenadas de la mas nueva a la mas vieja.
  readonly ventas = this.pedidosService.pedidos;

  readonly totalFacturado = computed(() =>
    this.ventas().reduce((acumulado, venta) => acumulado + venta.total, 0),
  );

  ngOnInit(): void {
    this.pedidosService.listar().subscribe();
  }
}
