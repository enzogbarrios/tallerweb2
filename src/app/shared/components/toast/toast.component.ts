import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NotificacionesService } from '../../../api/services/notificaciones/notificaciones.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ToastComponent {
  readonly notificaciones = inject(NotificacionesService);
}
