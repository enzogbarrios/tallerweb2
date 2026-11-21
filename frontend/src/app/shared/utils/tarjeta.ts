import { AbstractControl, ValidationErrors } from '@angular/forms';
import { MarcaTarjeta } from '../models/pedido.model';

export const NOMBRES_MARCA: Record<MarcaTarjeta, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  otra: 'Tarjeta',
};

export function detectarMarca(numero: string): MarcaTarjeta | null {
  const limpio = numero.replace(/\D/g, '');

  if (limpio.length === 0) return null;
  if (/^4/.test(limpio)) return 'visa';
  if (/^3[47]/.test(limpio)) return 'amex';
  if (/^(5[1-5]|2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720))/.test(limpio)) return 'mastercard';
  return 'otra';
}

export function formatearNumeroTarjeta(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 19);
  return digitos.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatearVencimiento(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
}

export function validarNumeroTarjeta(control: AbstractControl<string>): ValidationErrors | null {
  const digitos = control.value.replace(/\s+/g, '');
  if (!digitos) return null;
  return /^\d{13,19}$/.test(digitos) ? null : { numeroTarjeta: true };
}

export function validarVencimiento(control: AbstractControl<string>): ValidationErrors | null {
  const valor = control.value;
  if (!valor) return null;

  const coincide = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(valor);
  if (!coincide) return { formato: true };

  const fin = new Date(2000 + Number(coincide[2]), Number(coincide[1]), 1);
  return fin > new Date() ? null : { vencida: true };
}

export function validarCvv(grupo: AbstractControl): ValidationErrors | null {
  const numero: string = grupo.get('numero')?.value ?? '';
  const cvv: string = grupo.get('cvv')?.value ?? '';
  if (!/^\d{3,4}$/.test(cvv)) return null;

  const largo = detectarMarca(numero) === 'amex' ? 4 : 3;
  return cvv.length === largo ? null : { cvvMarca: largo };
}
