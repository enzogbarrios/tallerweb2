import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadoPedidoBadge } from '../estado-pedido/estado-pedido';
import { ImagenFallbackDirective } from '../../directives/imagen-fallback.directive';
import { Pedido } from '../../models/pedido.model';
import { nombreVariante } from '../../models/producto.model';
import { NOMBRES_MARCA } from '../../utils/tarjeta';

@Component({
  selector: 'app-resumen-pedido',
  imports: [RouterLink, CurrencyPipe, DatePipe, ImagenFallbackDirective, EstadoPedidoBadge],
  templateUrl: './resumen-pedido.html',
  host: { class: 'grid items-start gap-8 lg:grid-cols-3' },
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ResumenPedido {
  readonly pedido = input.required<Pedido>();

  readonly conLinks = input(false);
  readonly conCabecera = input(false);
  readonly titulo = input('Detalle del pedido');

  readonly nombreVariante = nombreVariante;
  readonly nombresMarca = NOMBRES_MARCA;

  readonly cantidadUnidades = computed(() =>
    this.pedido().items.reduce((total, item) => total + item.cantidad, 0),
  );
}
