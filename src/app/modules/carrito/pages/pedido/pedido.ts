import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';

@Component({
  selector: 'app-pedido',
  imports: [RouterLink, CurrencyPipe, DatePipe, ImagenFallbackDirective],
  templateUrl: './pedido.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Pedido {
  readonly pedido = inject(PedidosService).ultimoPedido;
  readonly auth = inject(AuthService);
}
