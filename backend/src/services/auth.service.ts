// Lógica de negocio de autenticación: hashear contraseñas, validar credenciales
// y emitir el token. El controller solo traduce eso a una respuesta HTTP.
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
import type { DatosRegistro } from '../models/usuario.model.js';
import type { RecuperacionRepository } from '../repository/recuperacion.repository.js';
import type { UsuariosRepository } from '../repository/usuarios.repository.js';
import { codigoDeError, ErrorApi } from '../utils/errores.js';
import { firmarToken } from '../utils/jwt.js';
import type { MailService } from './mail.service.js';

const MINUTOS_VALIDEZ_RECUPERACION = 30;

function hashearToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function tokenInvalido() {
  return new ErrorApi(
    400,
    'TOKEN_RECUPERACION_INVALIDO',
    'El link para restablecer la contraseña no es válido o ya venció. Pedí uno nuevo.',
  );
}

export class AuthService {
  private readonly usuarios: UsuariosRepository;
  private readonly recuperacion: RecuperacionRepository;
  private readonly mail: MailService;

  constructor(
    usuarios: UsuariosRepository,
    recuperacion: RecuperacionRepository,
    mail: MailService,
  ) {
    this.usuarios = usuarios;
    this.recuperacion = recuperacion;
    this.mail = mail;
  }

  async registrar(datos: DatosRegistro) {
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

  async iniciarSesion(email: string, password: string) {
    const encontrado = await this.usuarios.buscarPorEmail(email);
    const coincide =
      encontrado !== undefined && (await bcrypt.compare(password, encontrado.password_hash));

    // Mismo mensaje si el email no existe o la contraseña está mal (no damos pistas).
    if (!encontrado || !coincide) {
      throw new ErrorApi(401, 'CREDENCIALES_INVALIDAS', 'Email o contraseña incorrectos.');
    }

    const { password_hash: _omitido, ...usuario } = encontrado;
    return { token: firmarToken(usuario), usuario };
  }

  // Devuelve el usuario dueño del token. El front lo usa al recargar la página.
  async obtenerPorId(id: number) {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) {
      throw new ErrorApi(401, 'TOKEN_INVALIDO', 'La sesión no es válida o venció.');
    }
    return usuario;
  }

  async solicitarRecuperacion(email: string) {
    const usuario = await this.usuarios.buscarPorEmail(email);
    if (!usuario) return;

    const token = randomBytes(32).toString('hex');
    const venceEn = new Date(Date.now() + MINUTOS_VALIDEZ_RECUPERACION * 60_000);
    await this.recuperacion.reemplazar(usuario.id, hashearToken(token), venceEn);

    const link = `${config.frontendUrl}/auth/restablecer?token=${token}`;
    try {
      await this.mail.enviarRecuperarPassword(
        usuario.email,
        usuario.nombre,
        link,
        MINUTOS_VALIDEZ_RECUPERACION,
      );
    } catch (error) {
      console.error('No se pudo enviar el mail de recuperación:', error);
    }
  }

  async validarTokenRecuperacion(token: string) {
    const vigente = await this.recuperacion.buscarVigente(hashearToken(token));
    if (!vigente) throw tokenInvalido();
  }

  async restablecerPassword(token: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    const cambiada = await this.recuperacion.restablecerPassword(hashearToken(token), passwordHash);
    if (!cambiada) throw tokenInvalido();
  }
}
