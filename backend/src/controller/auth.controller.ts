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

  // devuelve el usuario dueño del token, lo usa el front al recargar la pagina
  public me = async (req: Request, res: Response) => {
    const usuario = await authService.obtenerPorId(req.usuario!.id);
    return res.json({ usuario });
  };

  public recuperar = (_req: Request, res: Response) => {
    return res.json({ mensaje: 'Te enviamos las instrucciones para recuperar tu contraseña.' });
  };
}
