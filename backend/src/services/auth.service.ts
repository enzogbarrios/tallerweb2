// Lógica de negocio de autenticación: hashear contraseñas, validar credenciales
// y emitir el token. El controller solo traduce eso a una respuesta HTTP.
import bcrypt from 'bcryptjs';
import type { DatosRegistro, Usuario } from '../models/usuario.model.js';
import type { UsuariosRepository } from '../repository/usuarios.repository.js';
import { codigoDeError, ErrorApi } from '../utils/errores.js';
import { firmarToken } from '../utils/jwt.js';

export type ResultadoAuth = {
  token: string;
  usuario: Usuario;
};

export class AuthService {
  private readonly usuarios: UsuariosRepository;

  constructor(usuarios: UsuariosRepository) {
    this.usuarios = usuarios;
  }

  async registrar(datos: DatosRegistro): Promise<ResultadoAuth> {
    const { password, ...resto } = datos;
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const usuario = await this.usuarios.crear({ ...resto, passwordHash });
      return { token: firmarToken(usuario), usuario };
    } catch (error) {
      // 23505 es el código de PostgreSQL para "ya existe" (índice único del email).
      if (codigoDeError(error) === '23505') {
        throw new ErrorApi(409, 'EMAIL_DUPLICADO', 'Ya existe una cuenta con este email.', {
          email: 'Ya existe una cuenta con este email.',
        });
      }
      throw error;
    }
  }

  async iniciarSesion(email: string, password: string): Promise<ResultadoAuth> {
    const encontrado = await this.usuarios.buscarPorEmail(email);
    const coincide = encontrado !== undefined && (await bcrypt.compare(password, encontrado.password_hash));

    // Mismo mensaje si el email no existe o la contraseña está mal (no damos pistas).
    if (!encontrado || !coincide) {
      throw new ErrorApi(401, 'CREDENCIALES_INVALIDAS', 'Email o contraseña incorrectos.');
    }

    const { password_hash: _omitido, ...usuario } = encontrado;
    return { token: firmarToken(usuario), usuario };
  }

  // Devuelve el usuario dueño del token. El front lo usa al recargar la página.
  async obtenerPorId(id: number): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) {
      throw new ErrorApi(401, 'TOKEN_INVALIDO', 'La sesión no es válida o venció.');
    }
    return usuario;
  }
}
