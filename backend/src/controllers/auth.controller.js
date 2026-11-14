// Lógica de signup, signin, me y recuperar. Recibe el request y decide qué responder.
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import * as usuarios from '../repositories/usuarios.repository.js';
import { ErrorApi } from '../utils/errores.js';
import { firmarToken } from '../utils/jwt.js';

// ---------- Esquemas de validación ----------

const password = z
  .string('La contraseña es obligatoria.')
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .regex(/[A-Z]/, 'La contraseña debe tener una letra mayúscula.')
  .regex(/[a-z]/, 'La contraseña debe tener una letra minúscula.')
  .regex(/\d/, 'La contraseña debe tener un número.')
  .regex(/[^A-Za-z0-9]/, 'La contraseña debe tener un carácter especial.');

const email = z.string('El email es obligatorio.').trim().toLowerCase().pipe(z.email('El email no es válido.'));
const texto = (nombreCampo) => z.string(`${nombreCampo} es obligatorio.`).trim().min(1, `${nombreCampo} es obligatorio.`);

export const esquemaSignup = z.object({
  email,
  password,
  nombre: texto('El nombre'),
  apellido: texto('El apellido'),
  direccion: texto('La dirección'),
});

export const esquemaSignin = z.object({
  email,
  password: z.string('La contraseña es obligatoria.').min(1, 'La contraseña es obligatoria.'),
});

export const esquemaRecuperar = z.object({ email });

// ---------- Handlers ----------

export async function signup(req, res) {
  const { password, ...datos } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);

  let usuario;
  try {
    usuario = await usuarios.crear({ ...datos, passwordHash });
  } catch (error) {
    // 23505 es el código de PostgreSQL para "ya existe" (índice único del email).
    if (error.code === '23505') {
      throw new ErrorApi(409, 'EMAIL_DUPLICADO', 'Ya existe una cuenta con este email.', {
        email: 'Ya existe una cuenta con este email.',
      });
    }
    throw error;
  }

  res.status(201).json({ token: firmarToken(usuario), usuario });
}

export async function signin(req, res) {
  const encontrado = await usuarios.buscarPorEmail(req.body.email);
  const coincide = encontrado && (await bcrypt.compare(req.body.password, encontrado.password_hash));

  // Mismo mensaje si el email no existe o la contraseña está mal (no damos pistas).
  if (!coincide) {
    throw new ErrorApi(401, 'CREDENCIALES_INVALIDAS', 'Email o contraseña incorrectos.');
  }

  const { password_hash, ...usuario } = encontrado;
  res.json({ token: firmarToken(usuario), usuario });
}

// Devuelve el usuario dueño del token. El front lo usa al recargar la página.
export async function me(req, res) {
  const usuario = await usuarios.buscarPorId(req.usuario.id);
  if (!usuario) {
    throw new ErrorApi(401, 'TOKEN_INVALIDO', 'La sesión no es válida o venció.');
  }
  res.json({ usuario });
}

// Respuesta siempre igual, exista o no el email (todavía no mandamos mails).
export function recuperar(req, res) {
  res.json({ mensaje: 'Si el email existe, te enviamos las instrucciones para recuperar tu contraseña.' });
}
