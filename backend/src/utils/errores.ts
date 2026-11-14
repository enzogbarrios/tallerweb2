// Error propio de la API. Lleva el código HTTP (400, 401, 404...), un código corto
// para que el front sepa qué pasó, un mensaje y, si hace falta, el detalle por campo.
export class ErrorApi extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly campos: Record<string, string> | undefined;

  constructor(status: number, codigo: string, mensaje: string, campos?: Record<string, string>) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = status;
    this.codigo = codigo;
    this.campos = campos;
  }
}

// Códigos de error de PostgreSQL (por ejemplo '23505' cuando se viola un índice único).
// Con strict, el error de un catch es `unknown`, así que lo revisamos antes de usarlo.
export function codigoDeError(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;

  const codigo = (error as { code: unknown }).code;
  return typeof codigo === 'string' ? codigo : undefined;
}
