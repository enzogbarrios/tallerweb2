import { Injectable, signal } from '@angular/core';
import { NuevoProducto, Producto } from '../../../shared/models/producto.model';

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  private readonly productosState = signal<Producto[]>([
    {
      id: 1,
      nombre: 'Remera Ranglan Rosa',
      descripcion:
        'Remera ranglan de algodón en color rosa, calce relajado y cuello redondo.',
      clasificacion: 'Remeras',
      precio: 70000,
      imagen: 'img/productos/remera-ranglan-rosa.webp',
      destacado: true,
    },
    {
      id: 2,
      nombre: 'Remera Easy Negra',
      descripcion:
        'Remera básica negra de algodón, calce clásico para el uso diario.',
      clasificacion: 'Remeras',
      precio: 63000,
      imagen: 'img/productos/remera-negra.webp',
      destacado: true,
    },
    {
      id: 3,
      nombre: 'Remera Gris Topo',
      descripcion:
        'Remera de algodón en gris topo con calce amplio y costuras reforzadas.',
      clasificacion: 'Remeras',
      precio: 70000,
      imagen: 'img/productos/remera-gris-topo.webp',
      destacado: false,
    },
    {
      id: 4,
      nombre: 'Remera Manga Larga Lima',
      descripcion:
        'Remera de manga larga en color lima, liviana y cómoda para entretiempo.',
      clasificacion: 'Remeras',
      precio: 95000,
      imagen: 'img/productos/remera-manga-larga-lima.webp',
      destacado: false,
    },
    {
      id: 5,
      nombre: 'Sweater Basic Rojo',
      descripcion:
        'Sweater tejido de punto grueso en color rojo, cálido y de calce holgado.',
      clasificacion: 'Sweaters',
      precio: 135000,
      imagen: 'img/productos/sweater-rojo.webp',
      destacado: true,
    },
    {
      id: 6,
      nombre: 'Sweater Basic Negro',
      descripcion:
        'Sweater tejido de punto grueso en color negro, un básico para el invierno.',
      clasificacion: 'Sweaters',
      precio: 135000,
      imagen: 'img/productos/sweater-negro.webp',
      destacado: false,
    },
    {
      id: 7,
      nombre: 'Sweater Basic Crudo',
      descripcion:
        'Sweater tejido de punto grueso en color crudo, suave y abrigado.',
      clasificacion: 'Sweaters',
      precio: 135000,
      imagen: 'img/productos/sweater-crudo.webp',
      destacado: false,
    },
    {
      id: 8,
      nombre: 'Sweater Rayas Verde',
      descripcion:
        'Sweater tejido con rayas en tonos verdes y calce oversize.',
      clasificacion: 'Sweaters',
      precio: 135000,
      imagen: 'img/productos/sweater-rayas-verde.webp',
      destacado: false,
    },
    {
      id: 9,
      nombre: 'Bermuda Jort Negra',
      descripcion:
        'Bermuda estilo jort en denim negro, larga y de calce holgado.',
      clasificacion: 'Bermudas',
      precio: 115000,
      imagen: 'img/productos/bermuda-jort-negra.webp',
      destacado: false,
    },
    {
      id: 10,
      nombre: 'Bermuda Jort Gris',
      descripcion:
        'Bermuda estilo jort en gris melange, cómoda y de calce amplio.',
      clasificacion: 'Bermudas',
      precio: 115000,
      imagen: 'img/productos/bermuda-jort-gris.webp',
      destacado: false,
    },
    {
      id: 11,
      nombre: 'Short Boardshort Azul',
      descripcion:
        'Short boardshort vintage en color azul, liviano y de secado rápido.',
      clasificacion: 'Shorts',
      precio: 95000,
      imagen: 'img/productos/short-boardshort-azul.webp',
      destacado: false,
    },
    {
      id: 12,
      nombre: 'Short Boardshort Rojo',
      descripcion:
        'Short boardshort vintage en color rojo, ideal para el verano.',
      clasificacion: 'Shorts',
      precio: 95000,
      imagen: 'img/productos/short-boardshort-rojo.webp',
      destacado: false,
    },
    {
      id: 13,
      nombre: 'Gorra Marrón',
      descripcion:
        'Gorra con visera curva y cierre ajustable en color marrón.',
      clasificacion: 'Accesorios',
      precio: 65000,
      imagen: 'img/productos/gorra-marron.webp',
      destacado: false,
    },
    {
      id: 14,
      nombre: 'Gorra Rosa',
      descripcion:
        'Gorra con visera curva y cierre ajustable en color rosa.',
      clasificacion: 'Accesorios',
      precio: 65000,
      imagen: 'img/productos/gorra-rosa.webp',
      destacado: false,
    },
    {
      id: 15,
      nombre: 'Gorra Negra',
      descripcion:
        'Gorra negra con visera curva y cierre ajustable, combina con todo.',
      clasificacion: 'Accesorios',
      precio: 65000,
      imagen: 'img/productos/gorra-negra.webp',
      destacado: false,
    },
    {
      id: 16,
      nombre: 'Jean Azul Stone',
      descripcion:
        'Jean de calce amplio en azul stone con paneles y costuras marcadas.',
      clasificacion: 'Jeans',
      precio: 135000,
      imagen: 'img/productos/jean-azul.webp',
      destacado: true,
    },
    {
      id: 17,
      nombre: 'Jean Negro Lavado',
      descripcion:
        'Jean de calce amplio en negro lavado con detalle de rayas.',
      clasificacion: 'Jeans',
      precio: 112000,
      imagen: 'img/productos/jean-negro-lavado.webp',
      destacado: false,
    },
    {
      id: 18,
      nombre: 'Campera Canvas Crudo',
      descripcion:
        'Campera de canvas en color crudo, resistente y de estilo workwear.',
      clasificacion: 'Camperas',
      precio: 116000,
      imagen: 'img/productos/campera-canvas-crudo.webp',
      destacado: false,
    },
    {
      id: 19,
      nombre: 'Buzo con Cierre Negro',
      descripcion:
        'Buzo con cierre frontal en color negro, de algodón con interior suave.',
      clasificacion: 'Buzos',
      precio: 145000,
      imagen: 'img/productos/buzo-zip-negro.webp',
      destacado: false,
    },
    {
      id: 20,
      nombre: 'Buzo con Cierre Gris',
      descripcion:
        'Buzo con cierre frontal en gris melange, de algodón con interior suave.',
      clasificacion: 'Buzos',
      precio: 145000,
      imagen: 'img/productos/buzo-zip-gris.webp',
      destacado: false,
    },
    {
      id: 21,
      nombre: 'Polo Negro',
      descripcion:
        'Polo negro de punto con cuello clásico y calce relajado.',
      clasificacion: 'Polos',
      precio: 95000,
      imagen: 'img/productos/polo-negro.webp',
      destacado: false,
    },
    {
      id: 22,
      nombre: 'Camisa Verde',
      descripcion:
        'Camisa manga corta con diseño a cuadros en color verde.',
      clasificacion: 'Camisas',
      precio: 85000,
      imagen: 'img/productos/camisa-verde.webp',
      destacado: false,
    },
    {
      id: 23,
      nombre: 'Cinto Negro',
      descripcion:
        'Cinto negro con hebilla metálica, resistente y fácil de combinar.',
      clasificacion: 'Accesorios',
      precio: 90000,
      imagen: 'img/productos/cinto-negro.webp',
      destacado: false,
    },
  ]);

  private siguienteId = 24;

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

  actualizar(id: number, datos: NuevoProducto): void {
    this.productosState.update((productos) =>
      productos.map((producto) => (producto.id === id ? { ...datos, id } : producto)),
    );
  }

  eliminar(id: number): void {
    this.productosState.update((productos) => productos.filter((producto) => producto.id !== id));
  }
}
