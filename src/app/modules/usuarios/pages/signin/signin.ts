import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { leerError } from '../../../../api/utils/leer-error';
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

    // La llamada a la API se hace al suscribirse. next = salió bien, error = salió mal.
    this.auth.iniciarSesion(email, password).subscribe({
      next: (usuario) => {
        this.notificaciones.mostrar(`¡Hola de nuevo, ${usuario.nombre}!`);
        this.router.navigate([this.auth.esAdmin() ? '/admin' : '/']);
      },
      error: (error) => this.error.set(leerError(error).mensaje),
    });
  }
}
