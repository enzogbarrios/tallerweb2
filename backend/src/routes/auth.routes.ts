// URLs de autenticación (todas cuelgan de /api/auth).
import { Router } from 'express';
import { AuthController } from '../controller/auth.controller.js';
import { autenticar } from '../middlewares/auth.js';
import { validar } from '../middlewares/validate.js';
import { esquemaRecuperar, esquemaSignin, esquemaSignup } from '../schemas/auth.schemas.js';

export const authRoutes = Router();

const authController = new AuthController();

authRoutes.post('/signup', validar(esquemaSignup), authController.signup);
authRoutes.post('/signin', validar(esquemaSignin), authController.signin);
authRoutes.get('/me', autenticar, authController.me);
authRoutes.post('/recuperar', validar(esquemaRecuperar), authController.recuperar);
