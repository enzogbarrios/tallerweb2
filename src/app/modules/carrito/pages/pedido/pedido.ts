import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';
import { Pedido as PedidoModel } from '../../../../shared/models/pedido.model';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';

@Component({
  selector: 'app-pedido',
  imports: [RouterLink, CurrencyPipe, DatePipe, ImagenFallbackDirective],
  templateUrl: './pedido.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Pedido implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pedidosService = inject(PedidosService);

  readonly pedido = signal<PedidoModel | undefined>(undefined);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    // se pide a la api para que el detalle siga estando despues de recargar la pagina
    this.pedidosService.obtener(id).subscribe({
      next: (pedido) => this.pedido.set(pedido),
    });
  }
}
