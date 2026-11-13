export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  direccion: string;
  password: string;
}

export type NuevoUsuario = Omit<Usuario, 'id'>;
