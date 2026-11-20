import { AbstractControl, ValidationErrors } from '@angular/forms';

export interface RequisitoPassword {
  texto: string;
  test: (valor: string) => boolean;
}

export const REQUISITOS_PASSWORD: RequisitoPassword[] = [
  { texto: 'Al menos 8 caracteres', test: (valor) => valor.length >= 8 },
  { texto: 'Una letra mayúscula', test: (valor) => /[A-Z]/.test(valor) },
  { texto: 'Una letra minúscula', test: (valor) => /[a-z]/.test(valor) },
  { texto: 'Un número', test: (valor) => /\d/.test(valor) },
  { texto: 'Un carácter especial', test: (valor) => /[^A-Za-z0-9]/.test(valor) },
];


export function passwordComplejaValidator(control: AbstractControl): ValidationErrors | null {
  const valor = String(control.value ?? '');
  const esValida = REQUISITOS_PASSWORD.every((requisito) => requisito.test(valor));

  return esValida ? null : { passwordCompleja: true };
}


export function passwordsIgualesValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmarPassword = group.get('confirmarPassword')?.value;

  if (!confirmarPassword) {
    return null;
  }

  return password === confirmarPassword ? null : { passwordsDistintas: true };
}
