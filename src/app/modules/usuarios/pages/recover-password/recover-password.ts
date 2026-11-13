import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';

@Component({
  selector: 'app-recover-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recover-password.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class RecoverPassword {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly mensaje = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  recuperar(): void {
    this.mensaje.set(null);
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.getRawValue().email.trim();

    if (this.auth.recuperarPassword(email)) {
      this.mensaje.set(
        `Si ${email} está registrado, te enviamos un enlace para restablecer tu contraseña.`,
      );
    } else {
      this.error.set('No encontramos una cuenta registrada con ese email.');
    }
  }
}
