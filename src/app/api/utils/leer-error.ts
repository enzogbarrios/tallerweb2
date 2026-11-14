import { HttpErrorResponse } from '@angular/common/http';

// Forma del error que devuelve el backend: { error: { codigo, mensaje, campos } }
export interface ErrorApi {
  codigo?: string;
  mensaje: string;
  campos?: Record<string, string>;
}

// Convierte cualquier error de HTTP en algo fácil de mostrar en pantalla.
export function leerError(error: unknown): ErrorApi {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return { mensaje: 'No se pudo conectar con el servidor. Probá de nuevo en un rato.' };
    }
    if (error.error?.error) {
      return error.error.error;
    }
  }
  return { mensaje: 'Ocurrió un error inesperado.' };
}
