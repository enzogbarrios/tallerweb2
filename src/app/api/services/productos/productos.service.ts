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

  // el back recibe la imagen como multipart, el navegador arma el FormData
  crear(datos: NuevoProducto): Observable<Producto> {
    return this.http
      .post<Producto>('/api/productos', this.armarFormData(datos))
      .pipe(tap((producto) => this.productosState.update((productos) => [...productos, producto])));
  }

  actualizar(id: number, datos: NuevoProducto): Observable<Producto> {
    return this.http
      .put<Producto>(`/api/productos/${id}`, this.armarFormData(datos))
      .pipe(
        tap((producto) =>
          this.productosState.update((productos) =>
            productos.map((item) => (item.id === id ? producto : item)),
          ),
        ),
      );
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<void>(`/api/productos/${id}`)
      .pipe(
        tap(() =>
          this.productosState.update((productos) =>
            productos.filter((producto) => producto.id !== id),
          ),
        ),
      );
  }

  private armarFormData(datos: NuevoProducto): FormData {
    const formData = new FormData();

    formData.append('nombre', datos.nombre);
    formData.append('descripcion', datos.descripcion);
    formData.append('clasificacion', datos.clasificacion);
    formData.append('precio', String(datos.precio));
    formData.append('destacado', String(datos.destacado));

    // si no se elige archivo al editar, el backend mantiene la imagen actual
    if (datos.imagen) {
      formData.append('imagen', datos.imagen);
    }

    return formData;
  }
}
