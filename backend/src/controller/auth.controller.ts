import type { Request, Response } from 'express';
import { RecuperacionRepository } from '../repository/recuperacion.repository.js';
import { UsuariosRepository } from '../repository/usuarios.repository.js';
import type {
  RecuperarDto,
  RestablecerDto,
  SigninDto,
  SignupDto,
} from '../schemas/auth.schemas.js';
import { AuthService } from '../services/auth.service.js';
import { MailService } from '../services/mail.service.js';

const authService = new AuthService(
  new UsuariosRepository(),
  new RecuperacionRepository(),
  new MailService(),
);

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

  public recuperar = async (req: Request, res: Response) => {
    const { email } = req.body as RecuperarDto;
    await authService.solicitarRecuperacion(email);
    return res.json({
      mensaje:
        'Si el email está registrado, te enviamos las instrucciones para recuperar tu contraseña.',
    });
  };

  public validarTokenRecuperacion = async (req: Request, res: Response) => {
    await authService.validarTokenRecuperacion(String(req.params['token']));
    return res.json({ valido: true });
  };

  public restablecer = async (req: Request, res: Response) => {
    const { token, password } = req.body as RestablecerDto;
    await authService.restablecerPassword(token, password);
    return res.json({ mensaje: 'Tu contraseña fue actualizada. Ya podés iniciar sesión.' });
  };
}
