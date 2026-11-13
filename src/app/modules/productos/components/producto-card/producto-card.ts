import { CurrencyPipe } from '@angular/common';
import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClasificacionIconoPipe } from '../../../../shared/pipes/clasificacion-icono.pipe';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';
import { Producto } from '../../../../shared/models/producto.model';

@Component({
  selector: 'app-producto-card',
  imports: [RouterLink, CurrencyPipe, ClasificacionIconoPipe, ImagenFallbackDirective],
  templateUrl: './producto-card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ProductoCard {
  readonly producto = input.required<Producto>();
  readonly agregar = output<Producto>();

  readonly agregado = signal(false);

  agregarAlCarrito(): void {
    this.agregar.emit(this.producto());
    this.agregado.set(true);
    setTimeout(() => this.agregado.set(false), 1300);
  }
}
