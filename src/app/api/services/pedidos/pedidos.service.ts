import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { DatosPedido, EstadoPedido, Pedido } from '../../../shared/models/pedido.model';

@Injectable({
  providedIn: 'root',
})
export class PedidosService {
  private readonly http = inject(HttpClient);

  // pedidos del usuario logueado (Mis pedidos)
  private readonly pedidosState = signal<Pedido[]>([]);
  // todos los pedidos, solo para el admin (Ventas)
  private readonly ventasState = signal<Pedido[]>([]);

  readonly pedidos = this.pedidosState.asReadonly();
  readonly ventas = this.ventasState.asReadonly();

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

  listarTodos(): Observable<Pedido[]> {
    return this.http
      .get<Pedido[]>('/api/pedidos/todos')
      .pipe(tap((ventas) => this.ventasState.set(ventas)));
  }

  obtener(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`/api/pedidos/${id}`);
  }

  // solo admin. el back responde con el pedido sin comprador, asi que en las
  // listas ya cargadas actualizamos solamente el estado
  cambiarEstado(id: number, estado: EstadoPedido): Observable<Pedido> {
    return this.http.patch<Pedido>(`/api/pedidos/${id}/estado`, { estado }).pipe(
      tap((pedido) => {
        this.pedidosState.update((pedidos) => this.reemplazarEstado(pedidos, id, pedido.estado));
        this.ventasState.update((ventas) => this.reemplazarEstado(ventas, id, pedido.estado));
      }),
    );
  }

  private reemplazarEstado(pedidos: Pedido[], id: number, estado: EstadoPedido): Pedido[] {
    return pedidos.map((pedido) => (pedido.id === id ? { ...pedido, estado } : pedido));
  }
}
