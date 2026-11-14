import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { ProductosService } from '../../../../api/services/productos/productos.service';
import { ProductoForm } from '../../../../shared/components/producto-form/producto-form';
import { NuevoProducto, Producto } from '../../../../shared/models/producto.model';

@Component({
  selector: 'app-edit-producto',
  imports: [RouterLink, ProductoForm],
  templateUrl: './edit-producto.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class EditProducto {
  private readonly route = inject(ActivatedRoute);
  private readonly productosService = inject(ProductosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);

  readonly producto = signal<Producto | undefined>(
    this.productosService.obtenerPorId(Number(this.route.snapshot.paramMap.get('id'))),
  );

  guardar(datos: NuevoProducto): void {
    const producto = this.producto();
    if (!producto) {
      return;
    }

    this.productosService.actualizar(producto.id, datos);
    this.notificaciones.mostrar(`"${datos.nombre}" se actualizó correctamente.`);
    this.router.navigate(['/admin']);
  }
}
