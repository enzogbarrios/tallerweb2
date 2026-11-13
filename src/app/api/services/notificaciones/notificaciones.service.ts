import { Injectable, signal } from '@angular/core';

export type TipoNotificacion = 'exito' | 'error' | 'info';

export interface Notificacion {
  texto: string;
  tipo: TipoNotificacion;
}

@Injectable({
  providedIn: 'root',
})
export class NotificacionesService {
  private readonly notificacionState = signal<Notificacion | null>(null);

  private temporizador?: ReturnType<typeof setTimeout>;

  readonly notificacion = this.notificacionState.asReadonly();

  mostrar(texto: string, tipo: TipoNotificacion = 'exito'): void {
    if (this.temporizador) {
      clearTimeout(this.temporizador);
    }

    this.notificacionState.set({ texto, tipo });
    this.temporizador = setTimeout(() => this.notificacionState.set(null), 3500);
  }

  cerrar(): void {
    if (this.temporizador) {
      clearTimeout(this.temporizador);
    }

    this.notificacionState.set(null);
  }
}
