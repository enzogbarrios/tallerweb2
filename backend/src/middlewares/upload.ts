// recibe la imagen del formulario de productos (campo "imagen")
// la deja en memoria y la valida, el service la guarda en disco si los datos estan bien
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ErrorApi } from '../utils/errores.js';

const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAXIMO = 2 * 1024 * 1024; // 2 MB

const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAXIMO },
  fileFilter: (_req, archivo, cb) => {
    if (!TIPOS.includes(archivo.mimetype)) {
      cb(new ErrorApi(400, 'ARCHIVO_INVALIDO', 'La imagen debe ser JPG, PNG o WebP.'));
      return;
    }
    cb(null, true);
  },
}).single('imagen');

export function recibirImagen(req: Request, res: Response, next: NextFunction): void {
  subida(req, res, (error: unknown) => {
    if (error instanceof ErrorApi) {
      next(error);
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new ErrorApi(413, 'ARCHIVO_GRANDE', 'La imagen no puede superar los 2 MB.'));
        return;
      }
      next(new ErrorApi(400, 'ARCHIVO_INVALIDO', 'No se pudo subir la imagen.'));
      return;
    }

    if (error) {
      next(error);
      return;
    }

    next();
  });
}
