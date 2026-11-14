// Middlewares de seguridad. Se ponen en una ruta antes del controller.
import { ErrorApi } from '../utils/errores.js';
import { verificarToken } from '../utils/jwt.js';

// Exige un token válido en el header "Authorization: Bearer <token>".
// Si está bien, deja el usuario en req.usuario = { id, rol }.
export function autenticar(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const [tipo, token] = encabezado.split(' ');

  if (tipo !== 'Bearer' || !token) {
    throw new ErrorApi(401, 'NO_AUTENTICADO', 'Tenés que iniciar sesión.');
  }

  try {
    req.usuario = verificarToken(token);
  } catch {
    throw new ErrorApi(401, 'TOKEN_INVALIDO', 'La sesión no es válida o venció.');
  }
  next();
}

// Se usa después de autenticar: solo deja pasar a los administradores.
export function requireAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    throw new ErrorApi(403, 'SIN_PERMISOS', 'No tenés permisos para hacer esto.');
  }
  next();
}
