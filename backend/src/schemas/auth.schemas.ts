import { z } from 'zod';

const password = z
  .string('La contraseña es obligatoria.')
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .regex(/[A-Z]/, 'La contraseña debe tener una letra mayúscula.')
  .regex(/[a-z]/, 'La contraseña debe tener una letra minúscula.')
  .regex(/\d/, 'La contraseña debe tener un número.')
  .regex(/[^A-Za-z0-9]/, 'La contraseña debe tener un carácter especial.');

const email = z
  .string('El email es obligatorio.')
  .trim()
  .toLowerCase()
  .pipe(z.email('El email no es válido.'));
const texto = (nombreCampo: string) =>
  z.string(`${nombreCampo} es obligatorio.`).trim().min(1, `${nombreCampo} es obligatorio.`);

export const esquemaSignup = z.object({
  email,
  password,
  nombre: texto('El nombre'),
  apellido: texto('El apellido'),
  direccion: texto('La dirección'),
});

export const esquemaSignin = z.object({
  email,
  password: z.string('La contraseña es obligatoria.').min(1, 'La contraseña es obligatoria.'),
});

export const esquemaRecuperar = z.object({ email });

const token = z
  .string('El link de recuperación no es válido.')
  .regex(/^[a-f0-9]{64}$/, 'El link de recuperación no es válido.');

export const esquemaRestablecer = z.object({ token, password });

export type SignupDto = z.infer<typeof esquemaSignup>;
export type SigninDto = z.infer<typeof esquemaSignin>;
export type RecuperarDto = z.infer<typeof esquemaRecuperar>;
export type RestablecerDto = z.infer<typeof esquemaRestablecer>;
