import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { DatosPedido, EstadoPedido, Pedido } from '../../../shared/models/pedido.model';
import { AuthService } from '../auth/auth.service';
import { ProductosService } from '../productos/productos.service';

@Injectable({
  providedIn: 'root',
})
export class PedidosService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly productos = inject(ProductosService);

  private readonly pedidosState = signal<Pedido[]>([]);
  private readonly cargadosPara = signal<number | null>(null);

  private readonly ventasState = signal<Pedido[]>([]);
  private readonly ventasCargadasPara = signal<number | null>(null);

  private readonly sesionCache = signal<number | null>(null);

  // Ademas de limpiar la cache al cambiar de sesion, mostramos [] mientras el id
  // cacheado no coincide con el del usuario actual: asi nunca se ven pedidos ajenos.
  readonly pedidos = computed(() =>
    this.cargadosPara() === (this.auth.usuarioActual()?.id ?? null) ? this.pedidosState() : [],
  );
  readonly ventas = computed(() =>
    this.ventasCargadasPara() === (this.auth.usuarioActual()?.id ?? null) ? this.ventasState() : [],
  );

  constructor() {
    // Al iniciar, cerrar o cambiar de sesion se descarta todo lo cacheado.
    effect(() => {
      const usuarioId = this.auth.usuarioActual()?.id ?? null;
      if (this.sesionCache() === usuarioId) {
        return;
      }
      this.sesionCache.set(usuarioId);
      this.pedidosState.set([]);
      this.ventasState.set([]);
      this.cargadosPara.set(null);
      this.ventasCargadasPara.set(null);
    });
  }

  crear(datos: DatosPedido): Observable<Pedido> {
    return this.http.post<Pedido>('/api/pedidos', datos).pipe(
      tap((pedido) => {
        this.pedidosState.update((pedidos) => [pedido, ...pedidos]);
        // El listado de ventas se recarga al abrir Ventas: asi trae el comprador.
        this.ventasCargadasPara.set(null);
      }),
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

        if (estado === 'Cancelado') {
          // El back devuelve el stock: refrescamos el catálogo para que no quede viejo.
          this.productos.cargar().subscribe();
        }
      }),
    );
  }
}
