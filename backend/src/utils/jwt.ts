// Crear y leer el token de sesión (JWT). El token guarda el id y el rol del usuario
// y está firmado con JWT_SECRET, así nadie puede inventarse uno.
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import type { Rol } from '../models/usuario.model.js';

export type TokenPayload = {
  id: number;
  rol: Rol;
};

export function firmarToken(usuario: { id: number; rol: Rol }): string {
  const payload: TokenPayload = { id: usuario.id, rol: usuario.rol };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

// Devuelve { id, rol } si el token es válido; si no, lanza un error.
export function verificarToken(token: string): TokenPayload {
  const decodificado = jwt.verify(token, config.jwtSecret);

  if (typeof decodificado === 'string') {
    throw new Error('Token inválido');
  }

  const { id, rol } = decodificado;
  if (typeof id !== 'number' || (rol !== 'cliente' && rol !== 'admin')) {
    throw new Error('Token inválido');
  }

  return { id, rol };
}
