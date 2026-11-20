import { CurrencyPipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { CarritoService } from '../../../../api/services/carrito/carrito.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { ProductosService } from '../../../../api/services/productos/productos.service';
import { Producto, Variante } from '../../../../shared/models/producto.model';
import { agregarAlCarrito } from '../../../../shared/utils/agregar-al-carrito';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';

const POCAS_UNIDADES = 5;

function opciones(valores: string[]): string[] {
  const unicos = [...new Set(valores)];
  return unicos.length === 1 && unicos[0] === '' ? [] : unicos;
}

@Component({
  selector: 'app-detail-producto',
  imports: [RouterLink, CurrencyPipe, ImagenFallbackDirective],
  templateUrl: './detail-producto.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class DetailProducto implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productosService = inject(ProductosService);
  private readonly carrito = inject(CarritoService);
  private readonly auth = inject(AuthService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly producto = signal<Producto | undefined>(undefined);
  readonly cantidad = signal(1);
  readonly talle = signal<string | null>(null);
  readonly color = signal<string | null>(null);

  readonly talles = computed(() => opciones(this.producto()?.variantes.map((v) => v.talle) ?? []));
  readonly colores = computed(() => opciones(this.producto()?.variantes.map((v) => v.color) ?? []));

  readonly variante = computed<Variante | undefined>(() => {
    const producto = this.producto();
    if (!producto) return undefined;

    const faltaTalle = this.talles().length > 0 && this.talle() === null;
    const faltaColor = this.colores().length > 0 && this.color() === null;
    if (faltaTalle || faltaColor) return undefined;

    return producto.variantes.find(
      (v) => v.talle === (this.talle() ?? '') && v.color === (this.color() ?? ''),
    );
  });

  readonly disponibles = computed(() => {
    const variante = this.variante();
    if (!variante) return 0;
    return Math.max(0, variante.stock - this.carrito.cantidadDe(variante.id));
  });

  readonly avisoStock = computed(() => {
    const producto = this.producto();
    const variante = this.variante();

    if (producto && producto.stock === 0) return 'Sin stock';
    if (!variante) {
      const faltan = [
        this.talles().length > 0 && this.talle() === null ? 'un talle' : '',
        this.colores().length > 0 && this.color() === null ? 'un color' : '',
      ].filter(Boolean);
      return faltan.length > 0 ? `Elegí ${faltan.join(' y ')}` : 'Esa combinación no está disponible';
    }
    if (variante.stock === 0) return 'Sin stock en esta variante';
    if (this.disponibles() === 0) return 'Ya tenés en el carrito todo el stock disponible';
    if (variante.stock <= POCAS_UNIDADES) {
      return `¡Últimas ${variante.stock} ${variante.stock === 1 ? 'unidad' : 'unidades'}!`;
    }
    return `${variante.stock} unidades disponibles`;
  });

  readonly puedeAgregar = computed(() => this.disponibles() > 0);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const enCache = this.productosService.obtenerPorId(id);
    this.elegirProducto(enCache);

    this.productosService
      .buscar(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (producto) => this.elegirProducto(producto),
        error: () => {
          if (!enCache) this.producto.set(undefined);
        },
      });
  }

  hayStockDeTalle(talle: string): boolean {
    return (this.producto()?.variantes ?? []).some(
      (v) => v.talle === talle && (this.color() === null || v.color === this.color()) && v.stock > 0,
    );
  }

  hayStockDeColor(color: string): boolean {
    return (this.producto()?.variantes ?? []).some(
      (v) => v.color === color && (this.talle() === null || v.talle === this.talle()) && v.stock > 0,
    );
  }

  elegirTalle(talle: string): void {
    this.talle.set(this.talle() === talle ? null : talle);
    this.ajustarCantidad();
  }

  elegirColor(color: string): void {
    this.color.set(this.color() === color ? null : color);
    this.ajustarCantidad();
  }

  aumentar(): void {
    this.cantidad.update((cantidad) => Math.min(cantidad + 1, Math.max(1, this.disponibles())));
  }

  disminuir(): void {
    this.cantidad.update((cantidad) => Math.max(1, cantidad - 1));
  }

  agregarAlCarrito(producto: Producto): void {
    const variante = this.variante();
    if (!variante || !this.puedeAgregar()) return;

    agregarAlCarrito(
      this.auth,
      this.router,
      this.carrito,
      this.notificaciones,
      producto,
      variante,
      this.cantidad(),
    );
    this.cantidad.set(1);
  }

  private elegirProducto(producto: Producto | undefined): void {
    this.producto.set(producto);
    if (!producto) return;

    const talles = this.talles();
    const colores = this.colores();
    if (talles.length === 1) this.talle.set(talles[0] ?? null);
    if (colores.length === 1) this.color.set(colores[0] ?? null);
    this.ajustarCantidad();
  }

  private ajustarCantidad(): void {
    this.cantidad.update((cantidad) => Math.max(1, Math.min(cantidad, this.disponibles())));
  }
}
