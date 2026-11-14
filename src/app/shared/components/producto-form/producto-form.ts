import { CurrencyPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ImagenFallbackDirective } from '../../directives/imagen-fallback.directive';
import {
  CLASIFICACIONES,
  Clasificacion,
  NuevoProducto,
  Producto,
} from '../../models/producto.model';

// Formulario compartido entre "agregar" y "editar" producto.
@Component({
  selector: 'app-producto-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, ImagenFallbackDirective],
  templateUrl: './producto-form.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ProductoForm implements OnInit {
  private readonly fb = inject(FormBuilder);

  /** Producto a editar. Si no se pasa, el formulario arranca vacío. */
  readonly producto = input<Producto>();
  readonly textoBoton = input('Guardar');
  readonly guardado = output<NuevoProducto>();

  readonly clasificaciones = CLASIFICACIONES;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(15)]],
    clasificacion: [CLASIFICACIONES[0] as Clasificacion, [Validators.required]],
    precio: [0, [Validators.required, Validators.min(1)]],
    // Acepta URLs completas o rutas internas como img/productos/remera.webp
    imagen: ['', [Validators.required, Validators.pattern(/^(https?:\/\/|img\/).+/)]],
    destacado: [false],
  });

  readonly vistaPrevia = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  ngOnInit(): void {
    const producto = this.producto();
    if (producto) {
      this.form.patchValue(producto);
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();

    this.guardado.emit({
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim(),
      clasificacion: valores.clasificacion,
      precio: Number(valores.precio),
      imagen: valores.imagen.trim(),
      destacado: valores.destacado,
    });
  }
}
