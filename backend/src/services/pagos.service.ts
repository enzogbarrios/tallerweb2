import { randomUUID } from 'node:crypto';
import type { MarcaTarjeta } from '../models/pedido.model.js';

export type ResultadoPago =
  | { estado: 'aprobado'; referencia: string; ultimos4: string }
  | { estado: 'rechazado'; referencia: string; ultimos4: string }
  | { estado: 'timeout'; ultimos4: string };

export function detectarMarca(numero: string): MarcaTarjeta {
  const limpio = numero.replace(/\D/g, '');

  if (/^4/.test(limpio)) return 'visa';
  if (/^3[47]/.test(limpio)) return 'amex';
  if (/^(5[1-5]|2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720))/.test(limpio)) return 'mastercard';
  return 'otra';
}

export class PagosService {
  simular(numero: string): ResultadoPago {
    const limpio = numero.replace(/\s+/g, '');
    const ultimos4 = limpio.slice(-4);
    const referencia = `SIM-${randomUUID()}`;

    if (ultimos4 === '0000') {
      return { estado: 'rechazado', referencia, ultimos4 };
    }

    if (ultimos4 === '1111') {
      return { estado: 'timeout', ultimos4 };
    }

    return { estado: 'aprobado', referencia, ultimos4 };
  }
}
