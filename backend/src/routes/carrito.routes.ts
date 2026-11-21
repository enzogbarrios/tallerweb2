import { Router } from 'express';
import { CarritoController } from '../controller/carrito.controller.js';
import { autenticar } from '../middlewares/auth.js';
import { validar } from '../middlewares/validate.js';
import { esquemaCantidad } from '../schemas/carrito.schemas.js';

export const carritoRoutes = Router();

const carritoController = new CarritoController();

carritoRoutes.get('/', autenticar, carritoController.listar);
carritoRoutes.put(
  '/items/:varianteId',
  autenticar,
  validar(esquemaCantidad),
  carritoController.actualizarItem,
);
carritoRoutes.delete('/items/:varianteId', autenticar, carritoController.quitarItem);
carritoRoutes.delete('/', autenticar, carritoController.vaciar);
