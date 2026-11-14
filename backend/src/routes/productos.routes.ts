// URLs de productos (cuelgan de /api/productos). Ver productos es público.
import { Router } from 'express';
import { ProductosController } from '../controller/productos.controller.js';

export const productosRoutes = Router();

const productosController = new ProductosController();

productosRoutes.get('/', productosController.listar);
productosRoutes.get('/:id', productosController.obtener);
