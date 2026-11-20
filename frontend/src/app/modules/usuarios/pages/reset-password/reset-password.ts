import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { leerError } from '../../../../api/utils/leer-error';
import {
  passwordComplejaValidator,
  passwordsIgualesValidator,
  REQUISITOS_PASSWORD,
} from '../../../../shared/validators/password.validator';

type EstadoPagina = 'validando' | 'invalido' | 'formulario';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
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

  readonly requisitos = computed(() =>
    REQUISITOS_PASSWORD.map((requisito) => ({
      texto: requisito.texto,
      cumple: requisito.test(this.passwordValue()),
    })),
  );

  readonly fortaleza = computed(
    () => this.requisitos().filter((requisito) => requisito.cumple).length,
  );

  readonly etiquetaFortaleza = computed(() => {
    const fortaleza = this.fortaleza();

    if (fortaleza <= 1) return 'Muy débil';
    if (fortaleza === 2) return 'Débil';
    if (fortaleza === 3) return 'Regular';
    if (fortaleza === 4) return 'Buena';
    return 'Fuerte';
  });

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
