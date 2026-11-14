import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { NuevoUsuario, Usuario } from '../../../shared/models/usuario.model';

const CLAVE_TOKEN = 'shaka_token';

interface RespuestaAuth {
  token: string;
  usuario: Usuario;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly usuarioActualState = signal<Usuario | null>(null);

  readonly usuarioActual = this.usuarioActualState.asReadonly();
  readonly esAdmin = computed(() => this.usuarioActual()?.rol === 'admin');

  // El token se guarda en el navegador para seguir logueado al recargar la página.
  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  // Estos métodos devuelven un Observable: la llamada se hace cuando el componente se suscribe.
  // Si el servidor rechaza los datos, el observable emite un error (se atrapa en el componente).
  iniciarSesion(email: string, password: string): Observable<Usuario> {
    return this.http.post<RespuestaAuth>('/api/auth/signin', { email, password }).pipe(
      tap((respuesta) => this.guardarSesion(respuesta)),
      map((respuesta) => respuesta.usuario),
    );
  }

  registrar(datos: NuevoUsuario): Observable<Usuario> {
    return this.http.post<RespuestaAuth>('/api/auth/signup', datos).pipe(
      tap((respuesta) => this.guardarSesion(respuesta)),
      map((respuesta) => respuesta.usuario),
    );
  }

  // Emite el mensaje que manda el servidor (siempre el mismo, exista o no el email).
  recuperarPassword(email: string): Observable<string> {
    return this.http
      .post<{ mensaje: string }>('/api/auth/recuperar', { email })
      .pipe(map((respuesta) => respuesta.mensaje));
  }

  // Se llama una vez al arrancar la app: si hay un token guardado, le pide el usuario al servidor.
  restaurarSesion(): Observable<unknown> {
    if (!this.obtenerToken()) {
      return of(null);
    }

    return this.http.get<{ usuario: Usuario }>('/api/auth/me').pipe(
      tap((respuesta) => this.usuarioActualState.set(respuesta.usuario)),
      catchError((error) => {
        // Solo borramos el token si el servidor dijo que no sirve (401).
        // Si el backend está apagado, lo dejamos para no desloguear al usuario sin motivo.
        if (error.status === 401) {
          localStorage.removeItem(CLAVE_TOKEN);
        }
        return of(null);
      }),
    );
  }

  cerrarSesion(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    this.usuarioActualState.set(null);
  }

  private guardarSesion(respuesta: RespuestaAuth): void {
    localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    this.usuarioActualState.set(respuesta.usuario);
  }
}
