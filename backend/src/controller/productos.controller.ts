// Recibe el request y decide qué responder. La lógica vive en ProductosService.
import type { Request, Response } from 'express';
import { ProductosRepository } from '../repository/productos.repository.js';
import { ProductosService } from '../services/productos.service.js';

const productosService = new ProductosService(new ProductosRepository());

export class ProductosController {
  public listar = async (_req: Request, res: Response) => {
    return res.json(await productosService.listar());
  };

  public obtener = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    return res.json(await productosService.obtener(id));
  };
}
