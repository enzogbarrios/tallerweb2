import { computed, Injectable, signal } from '@angular/core';
import { NuevoUsuario, Usuario } from '../../../shared/models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly usuariosState = signal<Usuario[]>([
    {
      id: 1,
      nombre: 'Demo',
      apellido: 'Shaka',
      email: 'demo@shaka.com',
      direccion: 'Calle 123',
      password: 'Shaka1234!',
      rol: 'cliente',
    },
    {
      id: 2,
      nombre: 'Admin',
      apellido: 'Shaka',
      email: 'admin@shaka.com',
      direccion: 'Calle 123',
      password: 'Shaka1234!',
      rol: 'admin',
    },
  ]);

  private readonly usuarioActualState = signal<Usuario | null>(null);

  private siguienteId = 3;

  readonly usuarios = this.usuariosState.asReadonly();
  readonly usuarioActual = this.usuarioActualState.asReadonly();
  readonly esAdmin = computed(() => this.usuarioActual()?.rol === 'admin');

  iniciarSesion(email: string, password: string): boolean {
    const emailNormalizado = email.trim().toLowerCase();
    const usuario = this.usuarios().find(
      (registrado) =>
        registrado.email.toLowerCase() === emailNormalizado && registrado.password === password,
    );

    if (!usuario) {
      return false;
    }

    this.usuarioActualState.set(usuario);
    return true;
  }

  registrar(datos: NuevoUsuario): { ok: boolean; error?: string } {
    if (this.existeEmail(datos.email)) {
      return { ok: false, error: 'Ya existe una cuenta registrada con ese email.' };
    }

    const nuevoUsuario: Usuario = {
      ...datos,
      id: this.siguienteId++,
      rol: 'cliente',
      email: datos.email.trim().toLowerCase(),
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      direccion: datos.direccion.trim(),
    };

    this.usuariosState.update((usuarios) => [...usuarios, nuevoUsuario]);
    this.usuarioActualState.set(nuevoUsuario);

    return { ok: true };
  }

  existeEmail(email: string): boolean {
    const emailNormalizado = email.trim().toLowerCase();
    return this.usuarios().some((usuario) => usuario.email.toLowerCase() === emailNormalizado);
  }

  recuperarPassword(email: string): boolean {
    return this.existeEmail(email);
  }

  cerrarSesion(): void {
    this.usuarioActualState.set(null);
  }
}
