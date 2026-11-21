import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { leerError } from '../../../../api/utils/leer-error';
import { MedidorPassword } from '../../../../shared/components/medidor-password/medidor-password';
import {
  passwordComplejaValidator,
  passwordsIgualesValidator,
} from '../../../../shared/validators/password.validator';

type EstadoPagina = 'validando' | 'invalido' | 'formulario';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, MedidorPassword],
  templateUrl: './reset-password.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ResetPassword {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly estado = signal<EstadoPagina>('validando');
  readonly mostrarPassword = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordValue = signal('');

  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, passwordComplejaValidator]],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: passwordsIgualesValidator },
  );

  constructor() {
    if (!this.token) {
      this.estado.set('invalido');
      return;
    }

    this.auth.validarTokenRecuperacion(this.token).subscribe({
      next: () => this.estado.set('formulario'),
      error: (error) => {
        const { codigo, mensaje } = leerError(error);

        if (codigo === 'TOKEN_RECUPERACION_INVALIDO') {
          this.estado.set('invalido');
        } else {
          this.error.set(mensaje);
          this.estado.set('formulario');
        }
      },
    });
  }

  actualizarPassword(event: Event): void {
    this.passwordValue.set((event.target as HTMLInputElement).value);
  }

  restablecer(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);

    this.auth.restablecerPassword(this.token, this.form.getRawValue().password).subscribe({
      next: (mensaje) => {
        this.notificaciones.mostrar(mensaje);
        this.router.navigateByUrl('/auth/signin');
      },
      error: (error) => {
        this.enviando.set(false);
        const { codigo, mensaje, campos } = leerError(error);

        if (codigo === 'TOKEN_RECUPERACION_INVALIDO') {
          this.estado.set('invalido');
        } else {
          this.error.set(campos?.['password'] ?? mensaje);
        }
      },
    });
  }
}
