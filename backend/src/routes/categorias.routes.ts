import { Router } from 'express';
import { CategoriasController } from '../controller/categorias.controller.js';
import { autenticar, requireAdmin } from '../middlewares/auth.js';
import { validar } from '../middlewares/validate.js';
import { esquemaCategoria } from '../schemas/categorias.schemas.js';

export const categoriasRoutes = Router();

const categoriasController = new CategoriasController();

categoriasRoutes.get('/', categoriasController.listar);

categoriasRoutes.get('/admin', autenticar, requireAdmin, categoriasController.listarAdmin);

categoriasRoutes.post(
  '/',
  autenticar,
  requireAdmin,
  validar(esquemaCategoria),
  categoriasController.crear,
);

categoriasRoutes.put(
  '/:id',
  autenticar,
  requireAdmin,
  validar(esquemaCategoria),
  categoriasController.actualizar,
);

categoriasRoutes.delete('/:id', autenticar, requireAdmin, categoriasController.eliminar);
