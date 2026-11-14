import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../api/services/auth/auth.service';

// Deja pasar a cualquier usuario con sesión iniciada; al resto lo manda al login.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.usuarioActual() ? true : router.createUrlTree(['/auth/signin']);
};
