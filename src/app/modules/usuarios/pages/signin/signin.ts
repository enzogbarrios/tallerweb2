import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';

@Component({
  selector: 'app-signin',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signin.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Signin {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);

  readonly mostrarPassword = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ingresar(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();

    if (!this.auth.iniciarSesion(email, password)) {
      this.error.set(
        'El email o la contraseña no son correctos. Verificá los datos e intentá nuevamente.',
      );
      return;
    }

    const usuario = this.auth.usuarioActual();
    this.notificaciones.mostrar(`¡Hola de nuevo, ${usuario?.nombre ?? ''}!`);
    this.router.navigate(['/']);
  }

  usarDemo(): void {
    this.form.setValue({
      email: 'demo@nebula.com',
      password: 'Demo1234!',
    });
    this.error.set(null);
  }
}
