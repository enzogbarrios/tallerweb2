import { Router } from 'express';
import { ProductosController } from '../controller/productos.controller.js';
import { autenticar, requireAdmin } from '../middlewares/auth.js';
import { recibirImagen } from '../middlewares/upload.js';
import { validar } from '../middlewares/validate.js';
import { esquemaProducto } from '../schemas/productos.schemas.js';

export const productosRoutes = Router();

const productosController = new ProductosController();

productosRoutes.get('/', productosController.listar);
productosRoutes.get('/admin', autenticar, requireAdmin, productosController.listarAdmin);
productosRoutes.get('/:id', productosController.obtener);

productosRoutes.post(
  '/',
  autenticar,
  requireAdmin,
  recibirImagen,
  validar(esquemaProducto),
  productosController.crear,
);

productosRoutes.put(
  '/:id',
  autenticar,
  requireAdmin,
  recibirImagen,
  validar(esquemaProducto),
  productosController.actualizar,
);

productosRoutes.delete('/:id', autenticar, requireAdmin, productosController.eliminar);
