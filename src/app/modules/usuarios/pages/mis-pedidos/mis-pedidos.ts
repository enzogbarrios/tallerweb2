import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';

@Component({
  selector: 'app-mis-pedidos',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './mis-pedidos.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class MisPedidos {
  private readonly auth = inject(AuthService);
  private readonly pedidosService = inject(PedidosService);

  // Solo los pedidos del usuario con sesión, los más recientes primero.
  readonly pedidos = computed(() => {
    const usuario = this.auth.usuarioActual();

    return this.pedidosService
      .pedidos()
      .filter((pedido) => usuario !== null && pedido.comprador?.id === usuario.id)
      .reverse();
  });
}
