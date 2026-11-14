import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { NuevoProducto, Producto } from '../../../shared/models/producto.model';

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  private readonly http = inject(HttpClient);

  // La lista vive en una señal: los componentes la leen con productos() y se actualizan solos.
  private readonly productosState = signal<Producto[]>([]);

  readonly productos = this.productosState.asReadonly();

  // Trae el catálogo desde la API. Se llama una vez al arrancar la app (ver app.config.ts).
  cargar(): Observable<unknown> {
    return this.http.get<Producto[]>('/api/productos').pipe(
      tap((lista) => this.productosState.set(lista)),
      catchError((error) => {
        console.error('No se pudieron cargar los productos', error);
        return of(null);
      }),
    );
  }

  obtenerPorId(id: number): Producto | undefined {
    return this.productos().find((producto) => producto.id === id);
  }

  // TODO (Fase 4): crear, actualizar y eliminar todavía trabajan solo en memoria.
  // Van a pasar a llamar a la API (con subida de imagen) cuando hagamos el admin de productos.
  crear(datos: NuevoProducto): Producto {
    const siguienteId = Math.max(0, ...this.productos().map((producto) => producto.id)) + 1;
    const nuevoProducto: Producto = { ...datos, id: siguienteId };

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
