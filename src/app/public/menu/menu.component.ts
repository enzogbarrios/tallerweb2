import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../api/services/auth/auth.service';
import { CarritoService } from '../../api/services/carrito/carrito.service';
import { NotificacionesService } from '../../api/services/notificaciones/notificaciones.service';

@Component({
  selector: 'app-menu',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './menu.component.css',
})
export class MenuComponent {
  readonly auth = inject(AuthService);
  readonly carrito = inject(CarritoService);

  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);

  cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.notificaciones.mostrar('Cerraste sesión correctamente.', 'info');
    this.router.navigate(['/']);
  }
}
