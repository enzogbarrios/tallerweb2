import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../api/services/auth/auth.service';

// Solo deja pasar al admin. Si no hay sesion guarda la url pedida en returnUrl;
// si hay sesion pero no es admin, lo devuelve al inicio en vez de al login.
export const adminGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.esAdmin()) {
    return true;
  }

  if (auth.usuarioActual()) {
    return router.createUrlTree(['/']);
  }

  return router.createUrlTree(['/auth/signin'], {
    queryParams: { returnUrl: estado.url },
  });
};
