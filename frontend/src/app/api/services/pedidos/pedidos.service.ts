import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { DatosPedido, EstadoPedido, Pedido } from '../../../shared/models/pedido.model';

@Injectable({
  providedIn: 'root',
})
export class PedidosService {
  private readonly http = inject(HttpClient);

  private readonly pedidosState = signal<Pedido[]>([]);
  private readonly cargadosPara = signal<number | null>(null);

  private readonly ventasState = signal<Pedido[]>([]);
  private readonly ventasCargadasPara = signal<number | null>(null);

  readonly pedidos = this.pedidosState.asReadonly();
  readonly ventas = this.ventasState.asReadonly();

  crear(datos: DatosPedido): Observable<Pedido> {
    return this.http.post<Pedido>('/api/pedidos', datos).pipe(
      tap((pedido) => this.pedidosState.update((pedidos) => [pedido, ...pedidos])),
    );
  }


  cargar(usuarioId: number): Observable<unknown> {
    if (this.cargadosPara() === usuarioId) {
      return of(null);
    }

    return this.http.get<Pedido[]>('/api/pedidos').pipe(
      tap((lista) => {
        this.pedidosState.set(lista);
        this.cargadosPara.set(usuarioId);
      }),
      catchError((error) => {
        console.error('No se pudieron cargar los pedidos', error);
        return of(null);
      }),
    );
  }

  cargarTodos(usuarioId: number): Observable<unknown> {
    if (this.ventasCargadasPara() === usuarioId) {
      return of(null);
    }

    return this.http.get<Pedido[]>('/api/pedidos/todos').pipe(
      tap((lista) => {
        this.ventasState.set(lista);
        this.ventasCargadasPara.set(usuarioId);
      }),
      catchError((error) => {
        console.error('No se pudieron cargar las ventas', error);
        return of(null);
      }),
    );
  }

  obtener(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`/api/pedidos/${id}`);
  }

  // solo admin. el back responde con el pedido sin comprador
  cambiarEstado(id: number, estado: EstadoPedido): Observable<Pedido> {
    return this.http.patch<Pedido>(`/api/pedidos/${id}/estado`, { estado }).pipe(
      tap((actualizado) => {
        this.pedidosState.update((pedidos) =>
          pedidos.map((pedido) => (pedido.id === id ? { ...pedido, ...actualizado } : pedido)),
        );
        this.ventasState.update((ventas) =>
          ventas.map((venta) =>
            venta.id === id ? { ...venta, ...actualizado, comprador: venta.comprador } : venta,
          ),
        );
      }),
    );
  }
}
