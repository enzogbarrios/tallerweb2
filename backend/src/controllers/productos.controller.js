// Lógica de los productos (por ahora solo lectura).
import * as productos from '../repositories/productos.repository.js';
import { ErrorApi } from '../utils/errores.js';

export async function listar(req, res) {
  res.json(await productos.listar());
}

export async function obtener(req, res) {
  const id = Number(req.params.id);
  // Si el id no es un número entero, tampoco puede existir: respondemos 404 sin consultar la base.
  const producto = Number.isInteger(id) ? await productos.buscarPorId(id) : undefined;

  if (!producto) {
    throw new ErrorApi(404, 'PRODUCTO_NO_ENCONTRADO', 'El producto no existe.');
  }
  res.json(producto);
}
