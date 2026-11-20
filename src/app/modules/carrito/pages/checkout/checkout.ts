import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../api/services/auth/auth.service';
import { CarritoService } from '../../../../api/services/carrito/carrito.service';
import { NotificacionesService } from '../../../../api/services/notificaciones/notificaciones.service';
import { PedidosService } from '../../../../api/services/pedidos/pedidos.service';
import { leerError } from '../../../../api/utils/leer-error';
import { SoloNumerosDirective } from '../../../../shared/directives/solo-numeros.directive';
import { MarcaTarjeta, PROVINCIAS } from '../../../../shared/models/pedido.model';
import {
  detectarMarca,
  formatearNumeroTarjeta,
  formatearVencimiento,
  NOMBRES_MARCA,
  validarCvv,
  validarNumeroTarjeta,
  validarVencimiento,
} from '../../../../shared/utils/tarjeta';

type Paso = 1 | 2 | 3 | 4;

function separarDireccion(direccion: string) {
  const [primera = '', segunda = ''] = direccion.split(',').map((parte) => parte.trim());
  const coincide = /^(.*\D)\s+(\d{1,6})$/.exec(primera);

  return {
    calle: coincide ? coincide[1].trim() : primera,
    numero: coincide ? coincide[2] : '',
    ciudad: segunda,
  };
}

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, SoloNumerosDirective],
  templateUrl: './checkout.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class Checkout {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  protected readonly carrito = inject(CarritoService);
  private readonly pedidos = inject(PedidosService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);

  readonly pasos: { numero: Paso; titulo: string }[] = [
    { numero: 1, titulo: 'Comprador' },
    { numero: 2, titulo: 'Envío' },
    { numero: 3, titulo: 'Pago' },
    { numero: 4, titulo: 'Revisión' },
  ];
  readonly provincias = PROVINCIAS;
  readonly nombresMarca = NOMBRES_MARCA;

  readonly paso = signal<Paso>(1);
  readonly pasoMaximo = signal<Paso>(1);
  readonly marca = signal<MarcaTarjeta | null>(null);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);

  private readonly usuario = this.auth.usuarioActual();
  private readonly direccionCuenta = separarDireccion(this.usuario?.direccion ?? '');

  readonly formComprador = this.fb.nonNullable.group({
    nombre: [this.usuario?.nombre ?? '', [Validators.required, Validators.maxLength(60)]],
    apellido: [this.usuario?.apellido ?? '', [Validators.required, Validators.maxLength(60)]],
    email: [this.usuario?.email ?? '', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{8,15}$/)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
  });

  readonly formDireccion = this.fb.nonNullable.group({
    calle: [this.direccionCuenta.calle, [Validators.required, Validators.maxLength(100)]],
    numero: [
      this.direccionCuenta.numero,
      [Validators.required, Validators.pattern(/^(\d{1,6}|[sS]\/[nN])$/)],
    ],
    piso_depto: ['', [Validators.maxLength(20)]],
    ciudad: [this.direccionCuenta.ciudad, [Validators.required, Validators.maxLength(80)]],
    provincia: ['', [Validators.required]],
    codigo_postal: [
      '',
      [Validators.required, Validators.pattern(/^([A-Za-z]\d{4}[A-Za-z]{3}|\d{4})$/)],
    ],
    indicaciones: ['', [Validators.maxLength(200)]],
  });

  readonly formPago = this.fb.nonNullable.group(
    {
      numero: ['', [Validators.required, validarNumeroTarjeta]],
      titular: ['', [Validators.required, Validators.minLength(3)]],
      vencimiento: ['', [Validators.required, validarVencimiento]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    },
    { validators: validarCvv },
  );

  private formDePaso(paso: Paso): FormGroup | null {
    if (paso === 1) return this.formComprador;
    if (paso === 2) return this.formDireccion;
    if (paso === 3) return this.formPago;
    return null;
  }

  siguiente(): void {
    const actual = this.paso();
    const form = this.formDePaso(actual);

    if (form?.invalid) {
      form.markAllAsTouched();
      return;
    }

    if (actual < 4) {
      const proximo = (actual + 1) as Paso;
      this.paso.set(proximo);
      if (proximo > this.pasoMaximo()) this.pasoMaximo.set(proximo);
      window.scrollTo({ top: 0 });
    }
  }

  anterior(): void {
    const actual = this.paso();
    if (actual > 1) this.paso.set((actual - 1) as Paso);
  }

  irA(paso: Paso): void {
    if (paso <= this.pasoMaximo()) this.paso.set(paso);
  }

  onNumeroTarjeta(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    const formateado = formatearNumeroTarjeta(valor);
    if (formateado !== valor) this.formPago.controls.numero.setValue(formateado);
    this.marca.set(detectarMarca(formateado));
  }

  onVencimiento(evento: Event): void {
    if ((evento as InputEvent).inputType?.startsWith('delete')) return;

    const valor = (evento.target as HTMLInputElement).value;
    const formateado = formatearVencimiento(valor);
    if (formateado !== valor) this.formPago.controls.vencimiento.setValue(formateado);
  }

  ultimos4(): string {
    return this.formPago.controls.numero.value.replace(/\D/g, '').slice(-4);
  }

  confirmar(): void {
    this.error.set(null);

    for (const paso of [1, 2, 3] as Paso[]) {
      const form = this.formDePaso(paso)!;
      if (form.invalid) {
        form.markAllAsTouched();
        this.paso.set(paso);
        return;
      }
    }

    const comprador = this.formComprador.getRawValue();
    const direccion = this.formDireccion.getRawValue();
    const pago = this.formPago.getRawValue();
    this.enviando.set(true);

    this.pedidos
      .crear({
        comprador,
        direccion: {
          ...direccion,
          piso_depto: direccion.piso_depto || null,
          indicaciones: direccion.indicaciones || null,
        },
        tarjeta: {
          numero: pago.numero.replace(/\s+/g, ''),
          titular: pago.titular,
          vencimiento: pago.vencimiento,
          cvv: pago.cvv,
        },
      })
      .subscribe({
        next: (pedido) => {
          this.carrito.limpiar();
          this.notificaciones.mostrar(`Pedido #${pedido.id} confirmado. ¡Gracias por tu compra!`);
          this.router.navigate(['/carrito/pedido', pedido.id]);
        },
        error: (error) => {
          this.enviando.set(false);
          const { mensaje, campos } = leerError(error);
          this.error.set(campos ? [mensaje, ...Object.values(campos)].join(' ') : mensaje);
        },
      });
  }
}
