import { Router } from 'express';
import { PedidosController } from '../controller/pedidos.controller.js';
import { autenticar, requireAdmin } from '../middlewares/auth.js';
import { validar } from '../middlewares/validate.js';
import { esquemaEstadoPedido, esquemaPedido } from '../schemas/pedidos.schemas.js';

export const pedidosRoutes = Router();

const pedidosController = new PedidosController();

pedidosRoutes.post('/', autenticar, validar(esquemaPedido), pedidosController.crear);
pedidosRoutes.get('/', autenticar, pedidosController.listar);
pedidosRoutes.get('/todos', autenticar, requireAdmin, pedidosController.listarTodos);
pedidosRoutes.get('/:id', autenticar, pedidosController.obtener);

// cambio de estado de una venta, solo el admin
pedidosRoutes.patch(
  '/:id/estado',
  autenticar,
  requireAdmin,
  validar(esquemaEstadoPedido),
  pedidosController.cambiarEstado,
);
