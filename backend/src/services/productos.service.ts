import type { ProductoDto } from '../schemas/productos.schemas.js';
import type { ProductosRepository } from '../repository/productos.repository.js';
import { ErrorApi } from '../utils/errores.js';
import { type ArchivoImagen, borrarImagen, guardarImagen } from '../utils/imagenes.js';

export class ProductosService {
  private readonly productos: ProductosRepository;

  constructor(productos: ProductosRepository) {
    this.productos = productos;
  }

  async listar() {
    return await this.productos.listar();
  }

  async obtener(id: number) {
    const producto = Number.isInteger(id) ? await this.productos.buscarPorId(id) : undefined;

    if (!producto) {
      throw new ErrorApi(404, 'PRODUCTO_NO_ENCONTRADO', 'El producto no existe.');
    }
    return producto;
  }

  async crear(datos: ProductoDto, archivo: ArchivoImagen) {
    const imagen = await guardarImagen(datos.nombre, archivo);

    try {
      const producto = await this.productos.crear({ ...datos, imagen });

      if (!producto) {
        throw new Error('No se pudo crear el producto');
      }
      return producto;
    } catch (error) {
      // si fallo la base no dejamos la imagen en disco
      await borrarImagen(imagen);
      throw error;
    }
  }

  async actualizar(id: number, datos: ProductoDto, archivo?: ArchivoImagen) {
    const actual = await this.obtener(id);
    const imagen = archivo ? await guardarImagen(datos.nombre, archivo) : actual.imagen;

    try {
      const producto = await this.productos.actualizar(id, { ...datos, imagen });

      if (!producto) {
        throw new Error('No se pudo actualizar el producto');
      }

      // Recién cuando el cambio se guardó borramos la imagen anterior.
      if (archivo) {
        await borrarImagen(actual.imagen);
      }
      return producto;
    } catch (error) {
      if (archivo && imagen !== actual.imagen) {
        await borrarImagen(imagen);
      }
      throw error;
    }
  }

  async eliminar(id: number) {
    const producto = await this.productos.eliminar(id);

    if (!producto) {
      throw new ErrorApi(404, 'PRODUCTO_NO_ENCONTRADO', 'El producto no existe.');
    }

    await borrarImagen(producto.imagen);
    return producto;
  }
}
