import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';
import { leerError } from '../../../../api/utils/leer-error';
import { EstadoPedidoBadge } from '../../../../shared/components/estado-pedido/estado-pedido';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';
import { EstadoPedido, Pedido } from '../../../../shared/models/pedido.model';
import { nombreVariante } from '../../../../shared/models/producto.model';
import { NOMBRES_MARCA } from '../../../../shared/utils/tarjeta';

const PASOS: Array<{ estado: EstadoPedido; titulo: string; icono: string }> = [
  { estado: 'Confirmado', titulo: 'Confirmado', icono: 'bi-check2-circle' },
  { estado: 'En preparación', titulo: 'En preparación', icono: 'bi-box-seam' },
  { estado: 'Enviado', titulo: 'Enviado', icono: 'bi-truck' },
  { estado: 'Entregado', titulo: 'Entregado', icono: 'bi-house-check' },
];

@Component({
  selector: 'app-detalle-pedido',
  imports: [RouterLink, CurrencyPipe, DatePipe, ImagenFallbackDirective, EstadoPedidoBadge],
  templateUrl: './detalle-pedido.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class DetallePedido implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pedidosService = inject(PedidosService);
  private readonly destroyRef = inject(DestroyRef);

  readonly nombreVariante = nombreVariante;
  readonly nombresMarca = NOMBRES_MARCA;
  readonly pasos = PASOS;

  readonly pedido = signal<Pedido | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly volverA: string =
    (this.router.currentNavigation()?.extras.state?.['volverA'] as string | undefined) ??
    '/mis-pedidos';

  readonly pasoActual = computed(() => {
    const estado = this.pedido()?.estado;
    return PASOS.findIndex((paso) => paso.estado === estado);
  });

  readonly cancelado = computed(() => this.pedido()?.estado === 'Cancelado');

  readonly cantidadUnidades = computed(() =>
    (this.pedido()?.items ?? []).reduce((total, item) => total + item.cantidad, 0),
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.cargando.set(false);
      return;
    }

    this.pedidosService
      .obtener(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pedido) => {
          this.pedido.set(pedido);
          this.cargando.set(false);
        },
        error: (error) => {
          this.cargando.set(false);
          const { codigo, mensaje } = leerError(error);
          if (codigo !== 'PEDIDO_NO_ENCONTRADO' && codigo !== 'ID_INVALIDO') {
            this.error.set(mensaje);
          }
        },
      });
  }

  volver(): void {
    this.router.navigateByUrl(this.volverA);
  }
}
