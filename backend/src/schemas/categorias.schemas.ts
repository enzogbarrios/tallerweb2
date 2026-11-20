import { z } from 'zod';
import { camposPaginacion } from '../utils/paginacion.js';

export const esquemaCategoria = z.object({
  nombre: z
    .string('El nombre es obligatorio.')
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(60, 'El nombre no puede superar los 60 caracteres.'),
  descripcion: z
    .string('La descripción debe ser un texto.')
    .trim()
    .max(300, 'La descripción no puede superar los 300 caracteres.')
    .default(''),
});

export type CategoriaDto = z.infer<typeof esquemaCategoria>;

export const ORDENES_CATEGORIAS = [
  'nombre_asc',
  'nombre_desc',
  'productos_desc',
  'recientes',
] as const;

export type OrdenCategorias = (typeof ORDENES_CATEGORIAS)[number];

export const esquemaListadoCategorias = z.object({
  ...camposPaginacion,
  q: z
    .string('La búsqueda debe ser un texto.')
    .trim()
    .max(100, 'La búsqueda no puede superar los 100 caracteres.')
    .default(''),
  orden: z.enum(ORDENES_CATEGORIAS, 'El orden no es válido.').default('nombre_asc'),
});

export type ListadoCategoriasDto = z.infer<typeof esquemaListadoCategorias>;
