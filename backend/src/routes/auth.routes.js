// URLs de autenticación (todas cuelgan de /api/auth).
import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { autenticar } from '../middlewares/auth.js';
import { validar } from '../middlewares/validate.js';

export const authRoutes = Router();

authRoutes.post('/signup', validar(auth.esquemaSignup), auth.signup);
authRoutes.post('/signin', validar(auth.esquemaSignin), auth.signin);
authRoutes.get('/me', autenticar, auth.me);
authRoutes.post('/recuperar', validar(auth.esquemaRecuperar), auth.recuperar);
