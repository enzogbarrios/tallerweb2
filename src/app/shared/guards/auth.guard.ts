import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../api/services/auth/auth.service';

// Deja pasar a cualquier usuario con sesión iniciada; al resto lo manda al login.
// guarda la url pedida en returnUrl para volver ahi despues de entrar
export const authGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.usuarioActual()) {
    return true;
  }

  return router.createUrlTree(['/auth/signin'], {
    queryParams: { returnUrl: estado.url },
  });
};
