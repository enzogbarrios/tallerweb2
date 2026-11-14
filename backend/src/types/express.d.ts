// Agrega `req.usuario` al tipo Request de Express. Lo completa el middleware
// `autenticar` cuando el token es válido.
import type { TokenPayload } from '../utils/jwt.js';

declare global {
  namespace Express {
    interface Request {
      usuario?: TokenPayload;
    }
  }
}

export {};
