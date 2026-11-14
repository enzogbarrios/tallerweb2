// Crear y leer el token de sesión (JWT). El token guarda el id y el rol del usuario
// y está firmado con JWT_SECRET, así nadie puede inventarse uno.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function firmarToken(usuario) {
  return jwt.sign({ id: usuario.id, rol: usuario.rol }, env.jwtSecret, { expiresIn: '7d' });
}

// Devuelve { id, rol } si el token es válido; si no, lanza un error.
export function verificarToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
