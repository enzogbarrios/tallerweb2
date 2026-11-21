import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';

function isoATexto(iso: string): string {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : '';
}

function textoAIso(texto: string): string | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!partes) return null;

  const [, dia, mes, anio] = partes;
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
  const existe =
    fecha.getFullYear() === Number(anio) &&
    fecha.getMonth() === Number(mes) - 1 &&
    fecha.getDate() === Number(dia);

  return existe ? `${anio}-${mes}-${dia}` : null;
}

function enmascarar(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

@Component({
  selector: 'app-campo-fecha',
  templateUrl: './campo-fecha.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class CampoFecha {
  readonly valor = input('');
  readonly min = input('');
  readonly max = input('');
  readonly idCampo = input<string>();
  readonly etiqueta = input('Fecha');

  readonly cambio = output<string>();

  readonly texto = linkedSignal(() => isoATexto(this.valor()));
  readonly error = signal<string | null>(null);

  private readonly calendario = viewChild<ElementRef<HTMLInputElement>>('calendario');

  escribir(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const texto = enmascarar(campo.value);

    campo.value = texto;
    this.texto.set(texto);
    this.error.set(null);

    if (texto === '') {
      this.emitir('');
    } else if (texto.length === 10) {
      this.confirmar();
    }
  }

  confirmar(): void {
    const texto = this.texto();

    if (texto === '') {
      this.error.set(null);
      return;
    }

    const iso = textoAIso(texto);
    if (!iso) {
      this.error.set(texto.length < 10 ? 'Completá la fecha (DD/MM/AAAA).' : 'La fecha no existe.');
      return;
    }
    if (this.min() && iso < this.min()) {
      this.error.set(`No puede ser anterior al ${isoATexto(this.min())}.`);
      return;
    }
    if (this.max() && iso > this.max()) {
      this.error.set(`No puede ser posterior al ${isoATexto(this.max())}.`);
      return;
    }

    this.error.set(null);
    this.emitir(iso);
  }

  abrirCalendario(): void {
    const calendario = this.calendario()?.nativeElement;
    if (!calendario) return;

    try {
      calendario.showPicker();
    } catch {
      calendario.focus();
    }
  }

  elegirDelCalendario(evento: Event): void {
    const iso = (evento.target as HTMLInputElement).value;
    this.texto.set(isoATexto(iso));
    this.error.set(null);
    this.emitir(iso);
  }

  private emitir(iso: string): void {
    if (iso !== this.valor()) {
      this.cambio.emit(iso);
    }
  }
}
