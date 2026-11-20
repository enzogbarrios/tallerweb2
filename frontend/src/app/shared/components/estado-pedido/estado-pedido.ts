import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EstadoPedido } from '../../models/pedido.model';

const CLASES_ESTADO: Record<EstadoPedido, string> = {
  Confirmado: 'bg-green-100 text-green-800',
  'En preparación': 'bg-amber-100 text-amber-800',
  Enviado: 'bg-blue-100 text-blue-800',
  Entregado: 'bg-gray-800 text-white',
  Cancelado: 'bg-red-100 text-red-800',
};

@Component({
  selector: 'app-estado-pedido',
  template: `<span
    class="inline-block px-2 py-1 text-xs font-bold whitespace-nowrap uppercase"
    [class]="clases()"
    >{{ estado() }}</span
  >`,
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class EstadoPedidoBadge {
  readonly estado = input.required<EstadoPedido>();

  readonly clases = computed(() => CLASES_ESTADO[this.estado()] ?? 'bg-gray-100 text-gray-800');
}
