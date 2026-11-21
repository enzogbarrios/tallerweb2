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

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink, MedidorPassword],
  templateUrl: './signup.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './signup.css',
})
export class Signup {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly mostrarPassword = signal(false);
  readonly error = signal<string | null>(null);
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  readonly passwordValue = signal('');

  readonly form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      password: ['', [Validators.required, passwordComplejaValidator]],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: passwordsIgualesValidator },
  );

  actualizarPassword(event: Event): void {
    this.passwordValue.set((event.target as HTMLInputElement).value);
  }

  registrarse(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();

    this.auth
      .registrar({
        nombre: valores.nombre,
        apellido: valores.apellido,
        email: valores.email,
        direccion: valores.direccion,
        password: valores.password,
      })
      .subscribe({
        next: () => {
          this.notificaciones.mostrar(`¡Bienvenido/a, ${valores.nombre}! Tu cuenta fue creada.`);
          this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') ?? '/');
        },
        error: (error) => {
          const { codigo, mensaje } = leerError(error);

          if (codigo === 'EMAIL_DUPLICADO') {
            // Marca el campo email con el error (se ve debajo del input).
            this.form.controls.email.setErrors({ emailDuplicado: true });
          } else {
            this.error.set(mensaje);
          }
        },
      });
  }
}
