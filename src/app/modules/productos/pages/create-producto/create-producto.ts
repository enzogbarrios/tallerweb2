import { CurrencyPipe } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { ProductosService } from '../../../../api/services/productos/productos.service';
import { CLASIFICACIONES, Clasificacion } from '../../../../shared/models/producto.model';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';
import { ClasificacionIconoPipe } from '../../../../shared/pipes/clasificacion-icono.pipe';

@Component({
  selector: 'app-create-producto',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    ClasificacionIconoPipe,
    ImagenFallbackDirective,
  ],
  templateUrl: './create-producto.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './create-producto.css',
})
export class CreateProducto {
  private readonly fb = inject(FormBuilder);
  private readonly productosService = inject(ProductosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);

  readonly clasificaciones = CLASIFICACIONES;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(15)]],
    clasificacion: [CLASIFICACIONES[0] as Clasificacion, [Validators.required]],
    precio: [0, [Validators.required, Validators.min(1)]],
    imagen: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
  });

  readonly vistaPrevia = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();

    const producto = this.productosService.crear({
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim(),
      clasificacion: valores.clasificacion,
      precio: Number(valores.precio),
      imagen: valores.imagen.trim(),
      destacado: false,
    });

    this.notificaciones.mostrar(`"${producto.nombre}" se publicó correctamente.`);
    this.router.navigate(['/productos', producto.id]);
  }
}
