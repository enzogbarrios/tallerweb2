import { CurrencyPipe } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ImagenFallbackDirective } from '../../directives/imagen-fallback.directive';
import { CategoriasService } from '../../../api/services/categorias/categorias.service';
import { NuevoProducto, Producto } from '../../models/producto.model';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const MAXIMO_IMAGEN = 2 * 1024 * 1024;

// Formulario compartido entre "agregar" y "editar" producto.
@Component({
  selector: 'app-producto-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, ImagenFallbackDirective],
  templateUrl: './producto-form.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ProductoForm implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);

  /** Producto a editar. Si no se pasa, el formulario arranca vacío. */
  readonly producto = input<Producto>();
  readonly textoBoton = input('Guardar');
  readonly guardado = output<NuevoProducto>();

  readonly categorias = inject(CategoriasService).categorias;
  readonly archivo = signal<File | null>(null);
  readonly nombreArchivo = signal('');
  readonly imagenPrevia = signal<string | null>(null);
  readonly errorImagen = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(15)]],
    categoria_id: [null as number | null, [Validators.required]],
    precio: [0, [Validators.required, Validators.min(1)]],
    destacado: [false],
  });

  readonly vistaPrevia = toSignal(this.form.valueChanges.pipe(map(() => this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  // url temporal para mostrar la imagen elegida antes de subirla
  private urlTemporal?: string;

  ngOnInit(): void {
    const producto = this.producto();
    if (!producto) {
      return;
    }

    this.form.patchValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      categoria_id: producto.categoria_id,
      precio: producto.precio,
      destacado: producto.destacado,
    });
    this.imagenPrevia.set(producto.imagen);
  }

  ngOnDestroy(): void {
    this.liberarUrlTemporal();
  }

  seleccionarImagen(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0];

    if (!archivo) {
      return;
    }

    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      this.errorImagen.set('La imagen debe ser JPG, PNG o WebP.');
      this.limpiarSeleccion(entrada);
      return;
    }

    if (archivo.size > MAXIMO_IMAGEN) {
      this.errorImagen.set('La imagen no puede superar los 2 MB.');
      this.limpiarSeleccion(entrada);
      return;
    }

    this.liberarUrlTemporal();
    this.urlTemporal = URL.createObjectURL(archivo);
    this.archivo.set(archivo);
    this.nombreArchivo.set(archivo.name);
    this.imagenPrevia.set(this.urlTemporal);
    this.errorImagen.set(null);
  }

  guardar(): void {
    this.form.markAllAsTouched();

    const faltaImagen = !this.archivo() && !this.producto();
    this.errorImagen.set(faltaImagen ? 'La imagen es obligatoria.' : null);

    const valores = this.form.getRawValue();

    if (this.form.invalid || faltaImagen || valores.categoria_id === null) {
      return;
    }

    this.guardado.emit({
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim(),
      categoria_id: valores.categoria_id,
      precio: Number(valores.precio),
      destacado: valores.destacado,
      imagen: this.archivo(),
    });
  }

  private limpiarSeleccion(entrada: HTMLInputElement): void {
    entrada.value = '';
    this.archivo.set(null);
    this.nombreArchivo.set('');
    this.liberarUrlTemporal();
    this.imagenPrevia.set(this.producto()?.imagen ?? null);
  }

  private liberarUrlTemporal(): void {
    if (this.urlTemporal) {
      URL.revokeObjectURL(this.urlTemporal);
      this.urlTemporal = undefined;
    }
  }
}
