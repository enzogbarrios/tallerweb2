import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { emailUnicoValidator } from '../../../../shared/validators/email.validator';
import {
  passwordComplejaValidator,
  passwordsIgualesValidator,
  REQUISITOS_PASSWORD,
} from '../../../../shared/validators/password.validator';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './signup.css',
})
export class Signup {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);

  readonly mostrarPassword = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordValue = signal('');

  readonly form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email, emailUnicoValidator(this.auth)]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
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

    const resultado = this.auth.registrar({
      nombre: valores.nombre,
      apellido: valores.apellido,
      email: valores.email,
      direccion: valores.direccion,
      password: valores.password,
    });

    if (!resultado.ok) {
      this.error.set(resultado.error ?? 'No se pudo crear la cuenta.');
      return;
    }

    this.notificaciones.mostrar(`¡Bienvenido/a, ${valores.nombre}! Tu cuenta fue creada.`);
    this.router.navigate(['/']);
  }
}
