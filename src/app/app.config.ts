import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import { forkJoin } from 'rxjs';
import localeEsAr from '@angular/common/locales/es-AR';

import { routes } from './app.routes';
import { authInterceptor } from './api/interceptors/auth.interceptor';
import { AuthService } from './api/services/auth/auth.service';
import { ProductosService } from './api/services/productos/productos.service';

registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Antes de mostrar la app: restaura la sesión (si había token) y carga el catálogo.
    // Así los guards y las páginas ya tienen los datos cuando se abren.
    // forkJoin espera a que terminen las dos llamadas.
    provideAppInitializer(() =>
      forkJoin([inject(AuthService).restaurarSesion(), inject(ProductosService).cargar()]),
    ),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),
    { provide: LOCALE_ID, useValue: 'es-AR' },
  ],
};
