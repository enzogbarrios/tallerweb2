import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificacionesService } from '../../api/services/notificaciones/notificaciones.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  private readonly notificaciones = inject(NotificacionesService);

  suscribirse(): void {
    this.notificaciones.mostrar('¡Gracias por suscribirte al newsletter de Nébula!');
  }
}
