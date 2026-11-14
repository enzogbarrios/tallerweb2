import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { ProductosService } from '../../../../api/services/productos/productos.service';
import { ProductoForm } from '../../../../shared/components/producto-form/producto-form';
import { NuevoProducto } from '../../../../shared/models/producto.model';

@Component({
  selector: 'app-create-producto',
  imports: [RouterLink, ProductoForm],
  templateUrl: './create-producto.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class CreateProducto {
  private readonly productosService = inject(ProductosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);

  guardar(datos: NuevoProducto): void {
    const producto = this.productosService.crear(datos);

    this.notificaciones.mostrar(`"${producto.nombre}" se publicó correctamente.`);
    this.router.navigate(['/admin']);
  }
}
