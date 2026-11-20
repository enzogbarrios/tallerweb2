import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  DatosPedido,
  EstadoPedido,
  FiltrosVentas,
  PaginaVentas,
  Pedido,
} from '../../../shared/models/pedido.model';

@Injectable({
  providedIn: 'root',
})
export class PedidosService {
  private readonly http = inject(HttpClient);

  // pedidos del usuario logueado (Mis pedidos)
  private readonly pedidosState = signal<Pedido[]>([]);

  readonly pedidos = this.pedidosState.asReadonly();

  crear(datos: DatosPedido): Observable<Pedido> {
    return this.http
      .post<Pedido>('/api/pedidos', datos)
      .pipe(tap((pedido) => this.pedidosState.update((pedidos) => [pedido, ...pedidos])));
  }

  listar(): Observable<Pedido[]> {
    return this.http
      .get<Pedido[]>('/api/pedidos')
      .pipe(tap((pedidos) => this.pedidosState.set(pedidos)));
  }

  listarTodos(filtros: FiltrosVentas): Observable<PaginaVentas> {
    let params = new HttpParams()
      .set('pagina', filtros.pagina)
      .set('limite', filtros.limite)
      .set('orden', filtros.orden);

    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.q.trim()) params = params.set('q', filtros.q.trim());
    if (filtros.desde) params = params.set('desde', filtros.desde);
    if (filtros.hasta) params = params.set('hasta', filtros.hasta);

    return this.http.get<PaginaVentas>('/api/pedidos/todos', { params });
  }

  obtener(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`/api/pedidos/${id}`);
  }

  // solo admin. el back responde con el pedido sin comprador, asi que en la
  // lista ya cargada actualizamos solamente el estado
  cambiarEstado(id: number, estado: EstadoPedido): Observable<Pedido> {
    return this.http.patch<Pedido>(`/api/pedidos/${id}/estado`, { estado }).pipe(
      tap((pedido) => {
        this.pedidosState.update((pedidos) =>
          pedidos.map((actual) =>
            actual.id === id ? { ...actual, estado: pedido.estado } : actual,
          ),
        );
      }),
    );
  }
}
