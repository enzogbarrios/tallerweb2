import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { CarritoResumen } from '../../../shared/models/carrito.model';
import { Producto } from '../../../shared/models/producto.model';
import { AuthService } from '../auth/auth.service';

const CARRITO_VACIO: CarritoResumen = {
  items: [],
  cantidadTotal: 0,
  subtotal: 0,
  envio: 0,
  total: 0,
};

@Injectable({
  providedIn: 'root',
})
export class CarritoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly carritoState = signal<CarritoResumen>(CARRITO_VACIO);

  readonly items = computed(() => this.carritoState().items);
  readonly cantidadTotal = computed(() => this.carritoState().cantidadTotal);
  readonly subtotal = computed(() => this.carritoState().subtotal);
  readonly envio = computed(() => this.carritoState().envio);
  readonly total = computed(() => this.carritoState().total);

  constructor() {
    // el carrito se carga al iniciar sesion y se limpia al cerrarla
    effect(() => {
      if (this.auth.usuarioActual()) {
        this.cargar().subscribe({ error: () => this.limpiar() });
      } else {
        this.limpiar();
      }
    });
  }

  cargar(): Observable<CarritoResumen> {
    return this.http
      .get<CarritoResumen>('/api/carrito')
      .pipe(tap((carrito) => this.carritoState.set(carrito)));
  }

  agregar(producto: Producto, cantidad = 1): Observable<CarritoResumen> {
    const cantidadActual = this.cantidadDe(producto.id);
    return this.actualizarCantidad(producto.id, cantidadActual + cantidad);
  }

  cambiarCantidad(productoId: number, cantidad: number): Observable<CarritoResumen> {
    if (cantidad <= 0) {
      return this.quitar(productoId);
    }
    return this.actualizarCantidad(productoId, cantidad);
  }

  quitar(productoId: number): Observable<CarritoResumen> {
    return this.http
      .delete<CarritoResumen>(`/api/carrito/items/${productoId}`)
      .pipe(tap((carrito) => this.carritoState.set(carrito)));
  }

  vaciar(): Observable<CarritoResumen> {
    return this.http
      .delete<CarritoResumen>('/api/carrito')
      .pipe(tap((carrito) => this.carritoState.set(carrito)));
  }

  limpiar(): void {
    this.carritoState.set({ ...CARRITO_VACIO });
  }

  private actualizarCantidad(productoId: number, cantidad: number): Observable<CarritoResumen> {
    return this.http
      .put<CarritoResumen>(`/api/carrito/items/${productoId}`, { cantidad })
      .pipe(tap((carrito) => this.carritoState.set(carrito)));
  }

  private cantidadDe(productoId: number): number {
    return this.items().find((item) => item.producto.id === productoId)?.cantidad ?? 0;
  }
}
