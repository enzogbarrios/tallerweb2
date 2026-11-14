// Atrapa cualquier error y responde siempre con la misma forma:
// { error: { codigo, mensaje, campos } }
import type { NextFunction, Request, Response } from 'express';
import { ErrorApi } from '../utils/errores.js';

export function rutaNoEncontrada(_req: Request, res: Response): void {
  res.status(404).json({ error: { codigo: 'NO_ENCONTRADO', mensaje: 'Ruta no encontrada.' } });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ErrorApi) {
    res.status(error.status).json({
      error: { codigo: error.codigo, mensaje: error.message, campos: error.campos },
    });
    return;
  }

  // JSON mal armado en el body.
  if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.parse.failed') {
    res.status(400).json({ error: { codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo no es un JSON válido.' } });
    return;
  }

  // Cualquier otro error es nuestro: lo mostramos en consola y no filtramos detalles al cliente.
  console.error(error);
  res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error en el servidor.' } });
}
