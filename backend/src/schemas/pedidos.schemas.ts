import { z } from 'zod';
import { ESTADOS_PEDIDO } from '../models/pedido.model.js';
import { camposPaginacion } from '../utils/paginacion.js';

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

export const esquemaEstadoPedido = z.object({
  estado: z.enum(ESTADOS_PEDIDO, 'El estado no es válido.'),
});

export type EstadoPedidoDto = z.infer<typeof esquemaEstadoPedido>;

export const ORDENES_VENTAS = ['recientes', 'antiguos', 'total_desc', 'total_asc'] as const;

export type OrdenVentas = (typeof ORDENES_VENTAS)[number];

const sinVacios = (valor: unknown) =>
  typeof valor === 'string' && valor.trim() === '' ? undefined : valor;

const fecha = (campo: string) =>
  z
    .string(`La fecha "${campo}" no es válida.`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, `Usá el formato AAAA-MM-DD en la fecha "${campo}".`)
    .refine((valor) => {
      const fechaReal = new Date(`${valor}T00:00:00Z`);
      return !Number.isNaN(fechaReal.getTime()) && fechaReal.toISOString().startsWith(valor);
    }, `La fecha "${campo}" no existe.`);

export const esquemaFiltrosVentas = z
  .object({
    ...camposPaginacion,
    estado: z.preprocess(sinVacios, z.enum(ESTADOS_PEDIDO, 'El estado no es válido.').optional()),
    q: z.preprocess(
      sinVacios,
      z
        .string('La búsqueda no es válida.')
        .trim()
        .max(100, 'La búsqueda no puede superar los 100 caracteres.')
        .optional(),
    ),
    desde: z.preprocess(sinVacios, fecha('desde').optional()),
    hasta: z.preprocess(sinVacios, fecha('hasta').optional()),
    orden: z.preprocess(
      sinVacios,
      z.enum(ORDENES_VENTAS, 'El orden no es válido.').default('recientes'),
    ),
  })
  .refine((filtros) => !filtros.desde || !filtros.hasta || filtros.desde <= filtros.hasta, {
    message: 'La fecha "desde" no puede ser posterior a "hasta".',
    path: ['hasta'],
  });

export type FiltrosVentas = z.infer<typeof esquemaFiltrosVentas>;
