import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';
import { leerError } from '../../../../api/utils/leer-error';
import { EstadoPedidoBadge } from '../../../../shared/components/estado-pedido/estado-pedido';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';
import { Pedido as PedidoModel } from '../../../../shared/models/pedido.model';
import { nombreVariante } from '../../../../shared/models/producto.model';
import { NOMBRES_MARCA } from '../../../../shared/utils/tarjeta';

@Component({
  selector: 'app-pedido',
  imports: [RouterLink, CurrencyPipe, DatePipe, ImagenFallbackDirective, EstadoPedidoBadge],
  templateUrl: './pedido.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Pedido implements OnInit {
  readonly nombreVariante = nombreVariante;

  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pedidosService = inject(PedidosService);

  readonly pedido = signal<PedidoModel | undefined>(undefined);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly nombresMarca = NOMBRES_MARCA;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        distinctUntilChanged(),
        switchMap((id) => {
          this.pedido.set(undefined);
          this.error.set(null);

          if (!Number.isInteger(id) || id <= 0) {
            this.cargando.set(false);
            return of(undefined);
          }

          this.cargando.set(true);
          // se pide a la api para que el detalle siga estando despues de recargar la pagina
          return this.pedidosService.obtener(id).pipe(
            catchError((error) => {
              this.cargando.set(false);
              const { codigo, mensaje } = leerError(error);
              if (codigo !== 'PEDIDO_NO_ENCONTRADO' && codigo !== 'ID_INVALIDO') {
                this.error.set(mensaje);
              }
              return of(undefined);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((pedido) => {
        this.pedido.set(pedido);
        this.cargando.set(false);
      });
  }
}
