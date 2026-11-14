// URLs de productos (cuelgan de /api/productos). Ver productos es público.
import { Router } from 'express';
import * as productos from '../controllers/productos.controller.js';

export const productosRoutes = Router();

productosRoutes.get('/', productos.listar);
productosRoutes.get('/:id', productos.obtener);
