// Recibe el request y decide qué responder. La lógica vive en AuthService.
import type { Request, Response } from 'express';
import { UsuariosRepository } from '../repository/usuarios.repository.js';
import type { SigninDto, SignupDto } from '../schemas/auth.schemas.js';
import { AuthService } from '../services/auth.service.js';

const authService = new AuthService(new UsuariosRepository());

export class AuthController {
  public signup = async (req: Request, res: Response) => {
    const resultado = await authService.registrar(req.body as SignupDto);
    return res.status(201).json(resultado);
  };

  public signin = async (req: Request, res: Response) => {
    const { email, password } = req.body as SigninDto;
    const resultado = await authService.iniciarSesion(email, password);
    return res.json(resultado);
  };

  // Devuelve el usuario dueño del token. El front lo usa al recargar la página.
  public me = async (req: Request, res: Response) => {
    const usuario = await authService.obtenerPorId(req.usuario!.id);
    return res.json({ usuario });
  };

  // Respuesta siempre igual, exista o no el email (todavía no mandamos mails).
  public recuperar = (_req: Request, res: Response) => {
    return res.json({ mensaje: 'Si el email existe, te enviamos las instrucciones para recuperar tu contraseña.' });
  };
}
