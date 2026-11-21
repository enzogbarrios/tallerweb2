import { z } from 'zod';

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
