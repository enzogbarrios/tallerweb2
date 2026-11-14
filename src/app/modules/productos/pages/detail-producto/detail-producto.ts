import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CarritoService } from '../../../../api/services/carrito/carrito.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { ProductosService } from '../../../../api/services/productos/productos.service';
import { Producto } from '../../../../shared/models/producto.model';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';

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
  private readonly notificaciones = inject(NotificacionesService);

  readonly producto = signal<Producto | undefined>(undefined);
  readonly cantidad = signal(1);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.producto.set(this.productosService.obtenerPorId(id));
  }

  aumentar(): void {
    this.cantidad.update((cantidad) => cantidad + 1);
  }

  disminuir(): void {
    this.cantidad.update((cantidad) => Math.max(1, cantidad - 1));
  }

  agregarAlCarrito(producto: Producto): void {
    const cantidad = this.cantidad();
    this.carrito.agregar(producto, cantidad);
    this.notificaciones.mostrar(
      `${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'} de ${producto.nombre} se agregó al carrito.`,
    );
  }
}
