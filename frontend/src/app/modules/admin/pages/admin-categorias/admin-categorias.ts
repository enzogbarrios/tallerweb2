import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { CategoriasService } from '../../../../api/services/categorias/categorias.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { leerError } from '../../../../api/utils/leer-error';
import {
  CategoriaAdmin,
  FiltrosCategorias,
  OrdenCategorias,
} from '../../../../shared/models/categoria.model';
import { Pagina } from '../../../../shared/models/pagina.model';

const FILTROS_INICIALES: FiltrosCategorias = {
  pagina: 1,
  limite: 10,
  q: '',
  orden: 'nombre_asc',
};

const PAGINAS_VISIBLES = 5;

@Component({
  selector: 'app-admin-categorias',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './admin-categorias.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminCategorias implements OnInit {
  private readonly categoriasService = inject(CategoriasService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly ordenes: Array<{ valor: OrdenCategorias; texto: string }> = [
    { valor: 'nombre_asc', texto: 'Nombre (A-Z)' },
    { valor: 'nombre_desc', texto: 'Nombre (Z-A)' },
    { valor: 'productos_desc', texto: 'Más productos' },
    { valor: 'recientes', texto: 'Más recientes' },
  ];

  readonly filtros = signal<FiltrosCategorias>(FILTROS_INICIALES);
  readonly resultado = signal<Pagina<CategoriaAdmin> | null>(null);
  readonly cargando = signal(true);
  readonly errorListado = signal<string | null>(null);

  readonly textoBusqueda = signal('');

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
    if (!editando) {
      return false;
    }

    const valores = this.valoresForm();
    return (
      (valores.nombre ?? '').trim() === editando.nombre &&
      (valores.descripcion ?? '').trim() === (editando.descripcion ?? '')
    );
  });

  readonly numerosPagina = computed(() => {
    const resultado = this.resultado();
    if (!resultado) {
      return [];
    }

    const hasta = Math.min(
      resultado.paginas,
      Math.max(resultado.pagina + Math.floor(PAGINAS_VISIBLES / 2), PAGINAS_VISIBLES),
    );
    const desde = Math.max(1, hasta - PAGINAS_VISIBLES + 1);

    return Array.from({ length: hasta - desde + 1 }, (_, indice) => desde + indice);
  });

  private readonly formulario = viewChild<ElementRef<HTMLElement>>('formulario');

  private readonly pedidos$ = new Subject<FiltrosCategorias>();
  private readonly busqueda$ = new Subject<string>();

  ngOnInit(): void {
    this.busqueda$
      .pipe(
        map((texto) => texto.trim()),
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((q) => this.cambiarFiltros({ q, pagina: 1 }));

    this.pedidos$
      .pipe(
        startWith(this.filtros()),
        tap(() => this.cargando.set(true)),
        switchMap((filtros) =>
          this.categoriasService.listarAdmin(filtros).pipe(
            catchError((error) => {
              this.errorListado.set(leerError(error).mensaje);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resultado) => {
        this.cargando.set(false);

        if (!resultado) {
          return;
        }

        if (resultado.items.length === 0 && resultado.pagina > 1) {
          this.cambiarFiltros({ pagina: Math.max(1, resultado.paginas) });
          return;
        }

        this.errorListado.set(null);
        this.resultado.set(resultado);
      });
  }

  buscar(evento: Event): void {
    const texto = (evento.target as HTMLInputElement).value;
    this.textoBusqueda.set(texto);
    this.busqueda$.next(texto);
  }

  ordenar(evento: Event): void {
    const orden = (evento.target as HTMLSelectElement).value as OrdenCategorias;
    this.cambiarFiltros({ orden, pagina: 1 });
  }

  irAPagina(pagina: number): void {
    const resultado = this.resultado();

    if (!resultado || pagina < 1 || pagina > resultado.paginas || pagina === resultado.pagina) {
      return;
    }
    this.cambiarFiltros({ pagina });
  }

  limpiarBusqueda(): void {
    this.textoBusqueda.set('');
    this.busqueda$.next('');
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
        this.recargar();
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
        this.recargar();
      },
      error: (error) => {
        this.confirmandoId.set(null);
        this.notificaciones.mostrar(leerError(error).mensaje, 'error');
      },
    });
  }

  private cambiarFiltros(cambios: Partial<FiltrosCategorias>): void {
    this.filtros.update((filtros) => ({ ...filtros, ...cambios }));
    this.pedidos$.next(this.filtros());
  }

  private recargar(): void {
    this.pedidos$.next(this.filtros());
  }
}
