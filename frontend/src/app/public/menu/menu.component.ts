import { Component, ElementRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../../api/services/auth/auth.service';
import { CarritoService } from '../../api/services/carrito/carrito.service';
import { NotificacionesService } from '../../api/services/notificaciones/notificaciones.service';
import { ImagenFallbackDirective } from '../../shared/directives/imagen-fallback.directive';

@Component({
  selector: 'app-menu',
  imports: [RouterLink, RouterLinkActive, ImagenFallbackDirective],
  templateUrl: './menu.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { '(document:click)': 'cerrarDropdownSiClickAfuera($event)' },
})
export class MenuComponent {
  readonly auth = inject(AuthService);
  readonly carrito = inject(CarritoService);

  readonly menuAbierto = signal(false);
  readonly usuarioMenuAbierto = signal(false);

  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);
  private readonly elemento = inject(ElementRef<HTMLElement>);

  constructor() {
    // Al navegar se cierran el menú móvil y el desplegable de usuario.
    this.router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuAbierto.set(false);
        this.usuarioMenuAbierto.set(false);
      });
  }

  cerrarSesion(): void {
    this.usuarioMenuAbierto.set(false);
    this.auth.cerrarSesion();
    this.notificaciones.mostrar('Cerraste sesión correctamente.', 'info');
    this.router.navigate(['/']);
  }

  cerrarDropdownSiClickAfuera(evento: Event): void {
    if (!this.elemento.nativeElement.contains(evento.target as Node)) {
      this.usuarioMenuAbierto.set(false);
    }
  }
}
