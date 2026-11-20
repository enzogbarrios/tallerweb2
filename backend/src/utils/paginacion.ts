import { z } from 'zod';
import { ErrorApi } from './errores.js';

export const LIMITE_POR_DEFECTO = 10;
export const LIMITE_MAXIMO = 50;

export type Pagina<T> = {
  items: T[];
  total: number;
  pagina: number;
  limite: number;
  paginas: number;
};

export const camposPaginacion = {
  pagina: z.coerce
    .number('La página debe ser un número.')
    .int('La página debe ser un número entero.')
    .min(1, 'La página debe ser 1 o mayor.')
    .default(1),
  limite: z.coerce
    .number('El límite debe ser un número.')
    .int('El límite debe ser un número entero.')
    .min(1, 'El límite debe ser 1 o mayor.')
    .max(LIMITE_MAXIMO, `El límite no puede superar ${LIMITE_MAXIMO}.`)
    .default(LIMITE_POR_DEFECTO),
};

export function calcularOffset(pagina: number, limite: number) {
  return (pagina - 1) * limite;
}

export function armarPagina<T>(items: T[], total: number, pagina: number, limite: number) {
  const resultado: Pagina<T> = {
    items,
    total,
    pagina,
    limite,
    paginas: Math.ceil(total / limite),
  };
  return resultado;
}

export function leerQuery<T extends z.ZodType>(esquema: T, query: unknown): z.infer<T> {
  const resultado = esquema.safeParse(query);

  if (!resultado.success) {
    const campos: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const campo = problema.path[0];
      if (campo === undefined) continue;
      const clave = String(campo);
      if (!campos[clave]) campos[clave] = problema.message;
    }
    throw new ErrorApi(400, 'DATOS_INVALIDOS', 'Hay filtros incorrectos.', campos);
  }

  return resultado.data;
}

export function patronBusqueda(texto: string) {
  return `%${texto.replace(/[\\%_]/g, '\\$&')}%`;
}
