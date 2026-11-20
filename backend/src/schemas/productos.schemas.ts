import { z } from 'zod';

// el formulario de productos llega como multipart, asi que los campos de texto
// son strings y el precio/destacado hay que convertirlos
const destacado = z.preprocess(
  (valor) => valor === true || valor === 'true' || valor === 'on' || valor === '1',
  z.boolean(),
);

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
});

export type ProductoDto = z.infer<typeof esquemaProducto>;
