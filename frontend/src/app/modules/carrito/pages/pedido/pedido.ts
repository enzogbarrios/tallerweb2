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
import { ResumenPedido } from '../../../../shared/components/resumen-pedido/resumen-pedido';
import { Pedido as PedidoModel } from '../../../../shared/models/pedido.model';

@Component({
  selector: 'app-pedido',
  imports: [RouterLink, ResumenPedido],
  templateUrl: './pedido.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Pedido implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pedidosService = inject(PedidosService);

  readonly pedido = signal<PedidoModel | undefined>(undefined);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

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
