import type { CarritoResumen, ItemCarritoFila } from '../models/carrito.model.js';
import type { CarritoRepository } from '../repository/carrito.repository.js';
import type { ProductosRepository } from '../repository/productos.repository.js';
import { ErrorApi } from '../utils/errores.js';

export const ENVIO = 4500;
export const ENVIO_GRATIS_DESDE = 50000;

export function calcularEnvio(subtotal: number, cantidadItems: number) {
  if (cantidadItems === 0) return 0;
  return subtotal >= ENVIO_GRATIS_DESDE ? 0 : ENVIO;
}

export class CarritoService {
  private readonly carrito: CarritoRepository;
  private readonly productos: ProductosRepository;

  constructor(carrito: CarritoRepository, productos: ProductosRepository) {
    this.carrito = carrito;
    this.productos = productos;
  }

  async obtener(usuarioId: number) {
    return this.armar(await this.carrito.listar(usuarioId));
  }

  async actualizarItem(usuarioId: number, varianteId: number, cantidad: number) {
    const variante = await this.productos.buscarVariante(varianteId);

    if (!variante) {
      throw new ErrorApi(404, 'VARIANTE_NO_ENCONTRADA', 'El producto no existe.');
    }

    if (variante.stock === 0) {
      throw new ErrorApi(409, 'SIN_STOCK', 'Este producto no tiene stock.');
    }

    const cantidadActual = await this.carrito.cantidadDe(usuarioId, varianteId);
    if (cantidad > variante.stock && cantidad > cantidadActual) {
      const unidades = variante.stock === 1 ? 'unidad' : 'unidades';
      throw new ErrorApi(409, 'SIN_STOCK', `Solo hay ${variante.stock} ${unidades} disponibles.`);
    }

    await this.carrito.guardar(usuarioId, variante.producto_id, varianteId, cantidad);
    return await this.obtener(usuarioId);
  }

  async quitarItem(usuarioId: number, varianteId: number) {
    await this.carrito.eliminar(usuarioId, varianteId);
    return await this.obtener(usuarioId);
  }

  async vaciar(usuarioId: number) {
    await this.carrito.vaciar(usuarioId);
    return await this.obtener(usuarioId);
  }

  // convierte las filas del join en el resumen que usa el front
  armar(filas: ItemCarritoFila[]): CarritoResumen {
    const items = filas.map((fila) => {
      const { cantidad, variante_id, talle, color, stock, ...producto } = fila;
      return { producto, variante: { id: variante_id, talle, color, stock }, cantidad };
    });

    const cantidadTotal = items.reduce((total, item) => total + item.cantidad, 0);
    const subtotal = items.reduce((total, item) => total + item.producto.precio * item.cantidad, 0);
    const envio = calcularEnvio(subtotal, items.length);

    return { items, cantidadTotal, subtotal, envio, total: subtotal + envio };
  }
}
