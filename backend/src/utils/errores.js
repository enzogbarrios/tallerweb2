// Error propio de la API. Lleva el código HTTP (400, 401, 404...), un código corto
// para que el front sepa qué pasó, un mensaje y, si hace falta, el detalle por campo.
export class ErrorApi extends Error {
  constructor(status, codigo, mensaje, campos) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.campos = campos;
  }
}
