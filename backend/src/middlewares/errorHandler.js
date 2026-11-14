// Atrapa cualquier error y responde siempre con la misma forma:
// { error: { codigo, mensaje, campos } }
import { ErrorApi } from '../utils/errores.js';

export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: { codigo: 'NO_ENCONTRADO', mensaje: 'Ruta no encontrada.' } });
}

export function errorHandler(error, req, res, next) {
  if (error instanceof ErrorApi) {
    return res.status(error.status).json({
      error: { codigo: error.codigo, mensaje: error.message, campos: error.campos },
    });
  }

  // JSON mal armado en el body.
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo no es un JSON válido.' } });
  }

  // Cualquier otro error es nuestro: lo mostramos en consola y no filtramos detalles al cliente.
  console.error(error);
  res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error en el servidor.' } });
}
