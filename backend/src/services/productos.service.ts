// Lógica de negocio de los productos (por ahora solo lectura).
import type { Producto } from '../models/producto.model.js';
import type { ProductosRepository } from '../repository/productos.repository.js';
import { ErrorApi } from '../utils/errores.js';

export class ProductosService {
  private readonly productos: ProductosRepository;

  constructor(productos: ProductosRepository) {
    this.productos = productos;
  }

  async listar(): Promise<Producto[]> {
    return await this.productos.listar();
  }

  async obtener(id: number): Promise<Producto> {
    // Si el id no es un número entero, tampoco puede existir: respondemos 404 sin consultar la base.
    const producto = Number.isInteger(id) ? await this.productos.buscarPorId(id) : undefined;

    if (!producto) {
      throw new ErrorApi(404, 'PRODUCTO_NO_ENCONTRADO', 'El producto no existe.');
    }
    return producto;
  }
}
