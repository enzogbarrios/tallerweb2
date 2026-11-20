import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import {
  Categoria,
  CategoriaAdmin,
  FiltrosCategorias,
  NuevaCategoria,
} from '../../../shared/models/categoria.model';
import { Pagina } from '../../../shared/models/pagina.model';
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

  listarAdmin(filtros: FiltrosCategorias): Observable<Pagina<CategoriaAdmin>> {
    let params = new HttpParams()
      .set('pagina', filtros.pagina)
      .set('limite', filtros.limite)
      .set('orden', filtros.orden);

    if (filtros.q.trim()) {
      params = params.set('q', filtros.q.trim());
    }

    return this.http.get<Pagina<CategoriaAdmin>>('/api/categorias/admin', { params });
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
