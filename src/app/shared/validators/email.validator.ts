import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { AuthService } from '../../api/services/auth/auth.service';


export function emailUnicoValidator(authService: AuthService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const email = String(control.value ?? '').trim();

    if (!email) {
      return null;
    }

    return authService.existeEmail(email) ? { emailDuplicado: true } : null;
  };
}
