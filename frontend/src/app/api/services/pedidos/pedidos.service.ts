import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagina } from '../../../shared/models/pagina.model';
import {
  DatosPedido,
  EstadoPedido,
  FiltrosMisPedidos,
  FiltrosVentas,
  PaginaVentas,
  Pedido,
} from '../../../shared/models/pedido.model';

@Injectable({
  providedIn: 'root',
})
export class PedidosService {
  private readonly http = inject(HttpClient);

  crear(datos: DatosPedido): Observable<Pedido> {
    return this.http.post<Pedido>('/api/pedidos', datos);
  }

  listar(filtros: FiltrosMisPedidos): Observable<Pagina<Pedido>> {
    return this.http.get<Pagina<Pedido>>('/api/pedidos', { params: this.armarParams(filtros) });
  }

  listarTodos(filtros: FiltrosVentas): Observable<PaginaVentas> {
    return this.http.get<PaginaVentas>('/api/pedidos/todos', {
      params: this.armarParams(filtros),
    });
  }

  obtener(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`/api/pedidos/${id}`);
  }

  // solo admin. el back responde con el pedido sin comprador
  cambiarEstado(id: number, estado: EstadoPedido): Observable<Pedido> {
    return this.http.patch<Pedido>(`/api/pedidos/${id}/estado`, { estado });
  }

  private armarParams(filtros: FiltrosVentas): HttpParams {
    let params = new HttpParams()
      .set('pagina', filtros.pagina)
      .set('limite', filtros.limite)
      .set('orden', filtros.orden);

    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.q.trim()) params = params.set('q', filtros.q.trim());
    if (filtros.desde) params = params.set('desde', filtros.desde);
    if (filtros.hasta) params = params.set('hasta', filtros.hasta);

    return params;
  }
}
