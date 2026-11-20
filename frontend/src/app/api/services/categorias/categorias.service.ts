import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { Categoria, NuevaCategoria } from '../../../shared/models/categoria.model';
import { ProductosService } from '../productos/productos.service';

@Injectable({
  providedIn: 'root',
})
export class CategoriasService {
  private readonly http = inject(HttpClient);
  private readonly productosService = inject(ProductosService);

  private readonly categoriasState = signal<Categoria[]>([]);

  readonly categorias = this.categoriasState.asReadonly();

  cargar(): Observable<unknown> {
    return this.http.get<Categoria[]>('/api/categorias').pipe(
      tap((lista) => this.categoriasState.set(lista)),
      catchError((error) => {
        console.error('No se pudieron cargar las categorías', error);
        return of(null);
      }),
    );
  }

  crear(datos: NuevaCategoria): Observable<Categoria> {
    return this.http
      .post<Categoria>('/api/categorias', datos)
      .pipe(switchMap((categoria) => this.refrescar(categoria)));
  }

  actualizar(id: number, datos: NuevaCategoria): Observable<Categoria> {
    return this.http
      .put<Categoria>(`/api/categorias/${id}`, datos)
      .pipe(
        switchMap((categoria) =>
          forkJoin([this.cargar(), this.productosService.cargar()]).pipe(map(() => categoria)),
        ),
      );
  }

  eliminar(id: number): Observable<void> {
    return this.http
      .delete<void>(`/api/categorias/${id}`)
      .pipe(switchMap(() => this.refrescar(undefined)));
  }

  private refrescar<T>(valor: T): Observable<T> {
    return this.cargar().pipe(map(() => valor));
  }
}
