import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CategoriasService } from '../../../../api/services/categorias/categorias.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { ProductosService } from '../../../../api/services/productos/productos.service';
import { leerError } from '../../../../api/utils/leer-error';
import { CategoriaAdmin, OrdenCategorias } from '../../../../shared/models/categoria.model';
import { paginasVisibles, slicePagina } from '../../../../shared/utils/paginacion';

const LIMITES = [5, 10, 20];
const LIMITE_POR_DEFECTO = 10;
const ORDEN_POR_DEFECTO: OrdenCategorias = 'nombre_asc';

@Component({
  selector: 'app-admin-categorias',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './admin-categorias.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminCategorias {
  private readonly categoriasService = inject(CategoriasService);
  private readonly productosService = inject(ProductosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly fb = inject(FormBuilder);

  readonly ordenes: Array<{ valor: OrdenCategorias; texto: string }> = [
    { valor: 'nombre_asc', texto: 'Nombre (A-Z)' },
    { valor: 'nombre_desc', texto: 'Nombre (Z-A)' },
    { valor: 'productos_desc', texto: 'Más productos' },
    { valor: 'recientes', texto: 'Más recientes' },
  ];
  readonly limites = LIMITES;

  readonly busqueda = signal('');
  readonly orden = signal<OrdenCategorias>(ORDEN_POR_DEFECTO);
  readonly pagina = signal(1);
  readonly limite = signal(LIMITE_POR_DEFECTO);

  readonly editando = signal<CategoriaAdmin | null>(null);
  readonly guardando = signal(false);
  readonly confirmandoId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    descripcion: ['', [Validators.maxLength(300)]],
  });

  private readonly valoresForm = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly sinCambios = computed(() => {
    const editando = this.editando();
    if (!editando) return false;

    const valores = this.valoresForm();
    return (
      (valores.nombre ?? '').trim() === editando.nombre &&
      (valores.descripcion ?? '').trim() === (editando.descripcion ?? '')
    );
  });

  readonly categorias = computed<CategoriaAdmin[]>(() => {
    const productos = this.productosService.productos();
    return this.categoriasService.categorias().map((categoria) => ({
      ...categoria,
      cantidad_productos: productos.filter((producto) => producto.categoria_id === categoria.id)
        .length,
    }));
  });

  readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const coincidentes = this.categorias().filter(
      (categoria) =>
        !texto ||
        categoria.nombre.toLowerCase().includes(texto) ||
        (categoria.descripcion ?? '').toLowerCase().includes(texto),
    );
    const copia = [...coincidentes];

    switch (this.orden()) {
      case 'nombre_asc':
        return copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      case 'nombre_desc':
        return copia.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'));
      case 'productos_desc':
        return copia.sort(
          (a, b) => b.cantidad_productos - a.cantidad_productos || a.nombre.localeCompare(b.nombre, 'es'),
        );
      default:
        // "recientes" ≈ id más alto primero
        return copia.sort((a, b) => b.id - a.id);
    }
  });

  readonly total = computed(() => this.filtrados().length);
  readonly totalPaginas = computed(() => Math.ceil(this.total() / this.limite()));
  readonly paginaActual = computed(() =>
    Math.min(this.pagina(), Math.max(1, this.totalPaginas())),
  );
  readonly items = computed(() =>
    slicePagina(this.filtrados(), this.paginaActual(), this.limite()),
  );

  readonly numerosPagina = computed(() =>
    paginasVisibles(this.paginaActual(), this.totalPaginas()),
  );

  private readonly formulario = viewChild<ElementRef<HTMLElement>>('formulario');

  buscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
    this.pagina.set(1);
  }

  ordenar(evento: Event): void {
    this.orden.set((evento.target as HTMLSelectElement).value as OrdenCategorias);
    this.pagina.set(1);
  }

  cambiarLimite(evento: Event): void {
    this.limite.set(Number((evento.target as HTMLSelectElement).value));
    this.pagina.set(1);
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.pagina.set(pagina);
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
    this.pagina.set(1);
  }

  editar(categoria: CategoriaAdmin): void {
    this.editando.set(categoria);
    this.confirmandoId.set(null);
    this.form.reset({ nombre: categoria.nombre, descripcion: categoria.descripcion });
    this.formulario()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  cancelarEdicion(): void {
    this.editando.set(null);
    this.form.reset({ nombre: '', descripcion: '' });
  }

  guardar(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.guardando() || this.sinCambios()) {
      return;
    }

    const valores = this.form.getRawValue();
    const datos = { nombre: valores.nombre.trim(), descripcion: valores.descripcion.trim() };
    const editando = this.editando();

    this.guardando.set(true);

    const pedido$ = editando
      ? this.categoriasService.actualizar(editando.id, datos)
      : this.categoriasService.crear(datos);

    pedido$.subscribe({
      next: (categoria) => {
        this.guardando.set(false);
        this.notificaciones.mostrar(
          editando
            ? `"${categoria.nombre}" se actualizó correctamente.`
            : `"${categoria.nombre}" se creó correctamente.`,
        );
        this.cancelarEdicion();
      },
      error: (error) => {
        this.guardando.set(false);
        const { mensaje, campos } = leerError(error);

        let marcoAlguno = false;
        for (const [campo, texto] of Object.entries(campos ?? {})) {
          const control = this.form.get(campo);
          if (control) {
            control.setErrors({ servidor: texto });
            control.markAsTouched();
            marcoAlguno = true;
          }
        }

        if (!marcoAlguno) {
          this.notificaciones.mostrar(mensaje, 'error');
        }
      },
    });
  }

  pedirConfirmacion(id: number): void {
    this.confirmandoId.set(id);
  }

  cancelar(): void {
    this.confirmandoId.set(null);
  }

  eliminar(categoria: CategoriaAdmin): void {
    this.categoriasService.eliminar(categoria.id).subscribe({
      next: () => {
        this.confirmandoId.set(null);
        if (this.editando()?.id === categoria.id) {
          this.cancelarEdicion();
        }
        this.notificaciones.mostrar(`"${categoria.nombre}" se eliminó.`, 'info');
      },
      error: (error) => {
        this.confirmandoId.set(null);
        this.notificaciones.mostrar(leerError(error).mensaje, 'error');
      },
    });
  }
}
