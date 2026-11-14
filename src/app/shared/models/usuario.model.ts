export type RolUsuario = 'admin' | 'cliente';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  direccion: string;
  password: string;
  rol: RolUsuario;
}

export type NuevoUsuario = Omit<Usuario, 'id' | 'rol'>;
