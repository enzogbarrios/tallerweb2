import { z } from 'zod';

export const esquemaCantidad = z.object({
  cantidad: z
    .number('La cantidad es obligatoria.')
    .int('La cantidad debe ser un número entero.')
    .min(1, 'La cantidad mínima es 1.')
    .max(99, 'La cantidad máxima es 99.'),
});

export type CantidadDto = z.infer<typeof esquemaCantidad>;
