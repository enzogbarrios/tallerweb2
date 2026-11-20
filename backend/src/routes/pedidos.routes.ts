import { Router } from 'express';
import { PedidosController } from '../controller/pedidos.controller.js';
import { autenticar } from '../middlewares/auth.js';
import { validar } from '../middlewares/validate.js';
import { esquemaPedido } from '../schemas/pedidos.schemas.js';

export const pedidosRoutes = Router();

const pedidosController = new PedidosController();

pedidosRoutes.post('/', autenticar, validar(esquemaPedido), pedidosController.crear);
pedidosRoutes.get('/', autenticar, pedidosController.listar);
pedidosRoutes.get('/:id', autenticar, pedidosController.obtener);
