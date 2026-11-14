import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

// Un interceptor se ejecuta en cada llamada HTTP.
// 1. Si hay sesión, agrega el token en el header Authorization.
// 2. Si el servidor responde 401 (token vencido o inválido), cierra la sesión y manda al login.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.obtenerToken();
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error) => {
      // Las rutas /auth/ se manejan en su propio componente (ej: contraseña incorrecta también es 401).
      if (token && error.status === 401 && !req.url.includes('/api/auth/')) {
        auth.cerrarSesion();
        router.navigate(['/auth/signin']);
      }
      return throwError(() => error);
    }),
  );
};
