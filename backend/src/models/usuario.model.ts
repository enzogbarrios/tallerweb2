export type Rol = 'cliente' | 'admin';

export class Usuario {
  id!: number;
  email!: string;
  nombre!: string;
  apellido!: string;
  direccion!: string;
  rol!: Rol;
}

// Solo se usa al iniciar sesión, para comparar la contraseña.
export class UsuarioConPassword extends Usuario {
  password_hash!: string;
}

export type NuevoUsuario = Pick<Usuario, 'email' | 'nombre' | 'apellido' | 'direccion'> & {
  passwordHash: string;
};

export type DatosRegistro = Pick<Usuario, 'email' | 'nombre' | 'apellido' | 'direccion'> & {
  password: string;
};
