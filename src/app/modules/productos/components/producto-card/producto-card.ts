import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';
import { Producto } from '../../../../shared/models/producto.model';

@Component({
  selector: 'app-producto-card',
  imports: [RouterLink, CurrencyPipe, ImagenFallbackDirective],
  templateUrl: './producto-card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ProductoCard {
  readonly producto = input.required<Producto>();
  readonly agregar = output<Producto>();

  readonly agregado = signal(false);

  private readonly auth = inject(AuthService);

  agregarAlCarrito(): void {
    this.agregar.emit(this.producto());

    // si no hay sesion el padre redirige al login y no mostramos el check
    if (!this.auth.usuarioActual()) {
      return;
    }

    this.agregado.set(true);
    setTimeout(() => this.agregado.set(false), 1300);
  }
}
