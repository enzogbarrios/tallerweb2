// Genera el nombre con el que se guarda cada imagen de producto.
// Ejemplo: ('Remera Ranglan Rosa', '.webp') -> 'remera-ranglan-rosa-9f2c41ab.webp'
import { randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ErrorApi } from './errores.js';
import { RAIZ_BACKEND } from './rutas.js';

const CARPETA = join(RAIZ_BACKEND, 'uploads', 'productos');

const EXTENSIONES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export type ArchivoImagen = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

// Pasa el texto a minúsculas, saca tildes y cambia todo lo que no sea letra o número por "-".
export function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Slug + 8 caracteres al azar, así dos productos con el mismo nombre no pisan su imagen.
export function nombreDeImagen(nombreProducto: string, extension: string): string {
  const base = slug(nombreProducto) || 'producto';
  return `${base}-${randomBytes(4).toString('hex')}${extension}`;
}

// guarda la imagen que llego por multer y devuelve la ruta que se usa en la base
export async function guardarImagen(nombreProducto: string, archivo: ArchivoImagen) {
  const extension = EXTENSIONES[archivo.mimetype];

  if (!extension) {
    throw new ErrorApi(400, 'ARCHIVO_INVALIDO', 'La imagen debe ser JPG, PNG o WebP.');
  }

  await mkdir(CARPETA, { recursive: true });

  const nombre = nombreDeImagen(nombreProducto, extension);
  await writeFile(join(CARPETA, nombre), archivo.buffer);

  return `uploads/productos/${nombre}`;
}

// borra una imagen del disco. solo toca archivos dentro de uploads/productos
// y no falla si el archivo ya no existe (por ejemplo imagenes viejas del seed)
export async function borrarImagen(ruta: string): Promise<void> {
  if (!/^uploads\/productos\/[a-z0-9][a-z0-9.-]*$/i.test(ruta)) {
    return;
  }

  try {
    await unlink(join(RAIZ_BACKEND, ruta));
  } catch {
    // si no existe no hay nada que limpiar
  }
}
