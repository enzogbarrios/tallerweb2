import { randomUUID } from 'node:crypto';

export type ResultadoPago =
  | { estado: 'aprobado'; referencia: string; ultimos4: string }
  | { estado: 'rechazado'; referencia: string; ultimos4: string }
  | { estado: 'timeout'; ultimos4: string };

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
