import { Injectable, signal } from '@angular/core';
import { NuevoProducto, Producto } from '../../../shared/models/producto.model';

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  private readonly productosState = signal<Producto[]>([
    {
      id: 1,
      nombre: 'Auriculares Nova Pro',
      descripcion:
        'Auriculares inalámbricos con cancelación activa de ruido, sonido envolvente y hasta 30 horas de batería.',
      clasificacion: 'Tecnología',
      precio: 129999,
      imagen:
        'img/productos/auriculares.jpg',
      destacado: true,
    },
    {
      id: 2,
      nombre: 'Zapatillas Urban Flow',
      descripcion:
        'Zapatillas livianas con suela flexible y diseño urbano, ideales para el día a día.',
      clasificacion: 'Indumentaria',
      precio: 89999,
      imagen:
        'img/productos/zapatillas.jpg',
      destacado: true,
    },
    {
      id: 3,
      nombre: 'Mochila Atlas 25L',
      descripcion:
        'Mochila resistente al agua con compartimento para notebook de 15 pulgadas y bolsillos organizadores.',
      clasificacion: 'Accesorios',
      precio: 64999,
      imagen:
        'img/productos/mochila.jpg',
      destacado: true,
    },
    {
      id: 4,
      nombre: 'Reloj Minimal One',
      descripcion:
        'Reloj de diseño minimalista con malla metálica ajustable y resistencia al agua para uso diario.',
      clasificacion: 'Accesorios',
      precio: 154999,
      imagen:
        'img/productos/reloj.jpg',
      destacado: true,
    },
    {
      id: 5,
      nombre: 'Cámara Lumen X',
      descripcion:
        'Cámara mirrorless de 24 MP con grabación en 4K y lente intercambiable para fotografía profesional.',
      clasificacion: 'Tecnología',
      precio: 289999,
      imagen:
        'img/productos/camara.jpg',
      destacado: false,
    },
    {
      id: 6,
      nombre: 'Teclado Mecánico Pulse',
      descripcion:
        'Teclado mecánico compacto con switches táctiles, retroiluminación RGB y conexión inalámbrica.',
      clasificacion: 'Tecnología',
      precio: 109999,
      imagen:
        'img/productos/teclado.jpg',
      destacado: false,
    },
    {
      id: 7,
      nombre: 'Lámpara Halo',
      descripcion:
        'Lámpara de escritorio con luz cálida regulable, brazo articulado y base de madera natural.',
      clasificacion: 'Hogar',
      precio: 45999,
      imagen:
        'img/productos/lampara.jpg',
      destacado: false,
    },
    {
      id: 8,
      nombre: 'Gorra Classic',
      descripcion:
        'Gorra de algodón con cierre ajustable y visera curva. Un clásico para completar cualquier look.',
      clasificacion: 'Indumentaria',
      precio: 24999,
      imagen:
        'img/productos/gorra.jpg',
      destacado: false,
    },
    {
      id: 9,
      nombre: 'Parlante Orbit',
      descripcion:
        'Parlante portátil Bluetooth con sonido estéreo, resistencia al agua y 12 horas de reproducción.',
      clasificacion: 'Tecnología',
      precio: 94999,
      imagen:
        'img/productos/parlante.jpg',
      destacado: false,
    },
    {
      id: 10,
      nombre: 'Buzo Oversize Cloud',
      descripcion:
        'Buzo de algodón premium con calce oversize, interior afelpado y capucha ajustable.',
      clasificacion: 'Indumentaria',
      precio: 74999,
      imagen:
        'img/productos/buzo.jpg',
      destacado: false,
    },
  ]);

  private siguienteId = 11;

  readonly productos = this.productosState.asReadonly();

  obtenerPorId(id: number): Producto | undefined {
    return this.productos().find((producto) => producto.id === id);
  }

  crear(datos: NuevoProducto): Producto {
    const nuevoProducto: Producto = {
      ...datos,
      id: this.siguienteId++,
    };

    this.productosState.update((productos) => [nuevoProducto, ...productos]);
    return nuevoProducto;
  }
}
