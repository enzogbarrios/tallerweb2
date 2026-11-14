// Genera el nombre con el que se guarda cada imagen de producto.
// Ejemplo: ('Remera Ranglan Rosa', '.webp') -> 'remera-ranglan-rosa-9f2c41ab.webp'
import { randomBytes } from 'node:crypto';

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
  return `${slug(nombreProducto)}-${randomBytes(4).toString('hex')}${extension}`;
}
