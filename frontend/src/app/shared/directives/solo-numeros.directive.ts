import { Directive, HostListener } from '@angular/core';

const TECLAS_DE_CONTROL = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Enter',
  'Escape',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'Unidentified',
]);

@Directive({
  selector: 'input[appSoloNumeros]',
})
export class SoloNumerosDirective {
  @HostListener('keydown', ['$event'])
  alPresionar(evento: KeyboardEvent): void {
    if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
    if (TECLAS_DE_CONTROL.has(evento.key)) return;

    if (!/^\d$/.test(evento.key)) {
      evento.preventDefault();
    }
  }

  @HostListener('beforeinput', ['$event'])
  antesDeEscribir(evento: InputEvent): void {
    if (evento.inputType === 'insertFromPaste') return;

    if (!evento.data || !/\D/.test(evento.data)) return;

    evento.preventDefault();
    const input = evento.target as HTMLInputElement;
    const digitos = evento.data.replace(/\D/g, '');

    if (digitos && input.type !== 'number') {
      input.setRangeText(digitos, input.selectionStart ?? 0, input.selectionEnd ?? 0, 'end');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  @HostListener('paste', ['$event'])
  alPegar(evento: ClipboardEvent): void {
    const texto = evento.clipboardData?.getData('text') ?? '';
    const digitos = texto.replace(/\D/g, '');

    if (digitos === texto) return;

    evento.preventDefault();
    const input = evento.target as HTMLInputElement;

    if (input.type === 'number') {
      input.value = digitos;
    } else {
      input.setRangeText(digitos, input.selectionStart ?? 0, input.selectionEnd ?? 0, 'end');
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  @HostListener('input', ['$event'])
  alEscribir(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    if (input.type === 'number' || !/\D/.test(input.value)) return;

    input.value = input.value.replace(/\D/g, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  @HostListener('drop', ['$event'])
  alSoltar(evento: DragEvent): void {
    evento.preventDefault();
  }
}
