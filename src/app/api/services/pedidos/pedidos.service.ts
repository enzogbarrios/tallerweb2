import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { DatosPedido, Pedido } from '../../../shared/models/pedido.model';

@Injectable({
  providedIn: 'root',
})
export class PedidosService {
  private readonly http = inject(HttpClient);
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

  obtener(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`/api/pedidos/${id}`);
  }
}
