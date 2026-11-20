import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';

@Component({
  selector: 'app-mis-pedidos',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './mis-pedidos.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class MisPedidos implements OnInit {
  private readonly pedidosService = inject(PedidosService);

  readonly pedidos = this.pedidosService.pedidos;

  ngOnInit(): void {
    this.pedidosService.listar().subscribe();
  }
}
