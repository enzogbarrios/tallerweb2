import { z } from 'zod';

const numeroTarjeta = z
  .string('El número de tarjeta es obligatorio.')
  .trim()
  .transform((valor) => valor.replace(/\s+/g, ''))
  .pipe(z.string().regex(/^\d{13,19}$/, 'El número de tarjeta no es válido.'));

const vencimiento = z
  .string('El vencimiento es obligatorio.')
  .trim()
  .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Usá el formato MM/AA.')
  .refine((valor) => {
    const [mes, anio] = valor.split('/');
    const fecha = new Date(2000 + Number(anio), Number(mes), 1);
    return fecha > new Date();
  }, 'La tarjeta está vencida.');

export const esquemaPedido = z.object({
  direccion_envio: z
    .string('La dirección es obligatoria.')
    .trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres.')
    .max(200, 'La dirección no puede superar los 200 caracteres.'),
  tarjeta: z.object({
    numero: numeroTarjeta,
    titular: z
      .string('El titular es obligatorio.')
      .trim()
      .min(3, 'El nombre del titular debe tener al menos 3 caracteres.'),
    vencimiento,
    cvv: z
      .string('El CVV es obligatorio.')
      .trim()
      .regex(/^\d{3,4}$/, 'El CVV debe tener 3 o 4 dígitos.'),
  }),
});

export type PedidoDto = z.infer<typeof esquemaPedido>;
