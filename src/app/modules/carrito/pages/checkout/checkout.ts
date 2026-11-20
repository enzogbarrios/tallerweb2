import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { CarritoService } from '../../../../api/services/carrito/carrito.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';
import { leerError } from '../../../../api/utils/leer-error';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './checkout.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Checkout {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly carrito = inject(CarritoService);
  private readonly pedidos = inject(PedidosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);

  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    direccion_envio: [
      this.auth.usuarioActual()?.direccion ?? '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(200)],
    ],
    numero: ['', [Validators.required, Validators.pattern(/^\d[\d\s]{12,22}$/)]],
    titular: ['', [Validators.required, Validators.minLength(3)]],
    vencimiento: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
  });

  confirmar(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    this.enviando.set(true);

    this.pedidos
      .crear({
        direccion_envio: valores.direccion_envio,
        tarjeta: {
          numero: valores.numero.replace(/\s+/g, ''),
          titular: valores.titular,
          vencimiento: valores.vencimiento,
          cvv: valores.cvv,
        },
      })
      .subscribe({
        next: (pedido) => {
          this.carrito.limpiar();
          this.notificaciones.mostrar(`Pedido #${pedido.id} confirmado. ¡Gracias por tu compra!`);
          this.router.navigate(['/carrito/pedido', pedido.id]);
        },
        error: (error) => {
          this.enviando.set(false);
          this.error.set(leerError(error).mensaje);
        },
      });
  }
}
