import { z } from 'zod';

// el formulario de productos llega como multipart, asi que los campos de texto
// son strings y el precio/destacado hay que convertirlos
const destacado = z.preprocess(
  (valor) => valor === true || valor === 'true' || valor === 'on' || valor === '1',
  z.boolean(),
);

const esquemaVariante = z.object({
  id: z.number().int().positive().optional(),
  talle: z
    .string('El talle no es válido.')
    .trim()
    .max(20, 'El talle no puede superar los 20 caracteres.')
    .default(''),
  color: z
    .string('El color no es válido.')
    .trim()
    .max(30, 'El color no puede superar los 30 caracteres.')
    .default(''),
  stock: z
    .number('El stock es obligatorio.')
    .int('El stock debe ser un número entero.')
    .min(0, 'El stock no puede ser negativo.')
    .max(100000, 'El stock es demasiado alto.'),
});

export const esquemaProducto = z.object({
  nombre: z
    .string('El nombre es obligatorio.')
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(120, 'El nombre no puede superar los 120 caracteres.'),
  descripcion: z
    .string('La descripción es obligatoria.')
    .trim()
    .min(15, 'La descripción debe tener al menos 15 caracteres.')
    .max(1000, 'La descripción no puede superar los 1000 caracteres.'),
  categoria_id: z.coerce
    .number('La categoría es obligatoria.')
    .int('La categoría no es válida.')
    .positive('Elegí una categoría.'),
  precio: z.coerce
    .number('El precio es obligatorio.')
    .int('El precio debe ser un número entero.')
    .positive('El precio debe ser mayor a cero.')
    .max(100000000, 'El precio es demasiado alto.'),
  destacado,
  variantes: z.preprocess(
    (valor) => {
      if (typeof valor !== 'string') return valor;
      try {
        return JSON.parse(valor);
      } catch {
        return valor;
      }
    },
    z
      .array(esquemaVariante, 'Las variantes no son válidas.')
      .min(1, 'Cargá al menos una variante con su stock.')
      .max(50, 'No puede haber más de 50 variantes.')
      .refine((variantes) => {
        const claves = variantes.map((v) => `${v.talle.toLowerCase()}|${v.color.toLowerCase()}`);
        return new Set(claves).size === claves.length;
      }, 'Hay variantes repetidas (mismo talle y color).'),
  ),
});

export type ProductoDto = z.infer<typeof esquemaProducto>;
