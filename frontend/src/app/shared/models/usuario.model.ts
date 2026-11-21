export type RolUsuario = 'admin' | 'cliente';

// El usuario que devuelve la API. La contraseña nunca viaja de vuelta al navegador.
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  direccion: string;
  rol: RolUsuario;
}

// Lo que se manda al registrarse (acá sí va la contraseña).
export interface NuevoUsuario extends Omit<Usuario, 'id' | 'rol'> {
  password: string;
}
