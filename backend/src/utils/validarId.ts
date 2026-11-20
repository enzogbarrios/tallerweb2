import { ErrorApi } from './errores.js';

export function idNumerico(valor: string | string[] | undefined): number {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  const id = Number(texto);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorApi(400, 'ID_INVALIDO', 'El ID no es válido.');
  }

  return id;
}
