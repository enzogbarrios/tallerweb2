// Valida el body de un request con un esquema de zod.
// Si hay errores, responde 400 con un mensaje por cada campo.
import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ErrorApi } from '../utils/errores.js';

export function validar(esquema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const resultado = esquema.safeParse(req.body);

    if (!resultado.success) {
      const campos: Record<string, string> = {};
      for (const problema of resultado.error.issues) {
        // Los campos anidados se mandan como "comprador.email" o "tarjeta.cvv".
        if (problema.path.length === 0) continue;
        const clave = problema.path.map(String).join('.');
        if (!campos[clave]) campos[clave] = problema.message;
      }
      throw new ErrorApi(400, 'DATOS_INVALIDOS', 'Hay datos incorrectos.', campos);
    }

    req.body = resultado.data; // datos ya limpios (sin espacios, email en minúscula)
    next();
  };
}
