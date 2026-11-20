import type { Request, Response } from 'express';
import { ProductosRepository } from '../repository/productos.repository.js';
import type { ProductoDto } from '../schemas/productos.schemas.js';
import { ProductosService } from '../services/productos.service.js';
import { ErrorApi } from '../utils/errores.js';
import { idNumerico } from '../utils/validarId.js';

const productosService = new ProductosService(new ProductosRepository());

export class ProductosController {
  public listar = async (_req: Request, res: Response) => {
    return res.json(await productosService.listar());
  };

  public obtener = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    return res.json(await productosService.obtener(id));
  };

  public crear = async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ErrorApi(400, 'IMAGEN_REQUERIDA', 'La imagen del producto es obligatoria.');
    }

    const producto = await productosService.crear(req.body as ProductoDto, req.file);
    return res.status(201).json(producto);
  };

  public actualizar = async (req: Request, res: Response) => {
    const id = idNumerico(req.params.id);
    const producto = await productosService.actualizar(id, req.body as ProductoDto, req.file);
    return res.json(producto);
  };

  public eliminar = async (req: Request, res: Response) => {
    const id = idNumerico(req.params.id);
    await productosService.eliminar(id);
    return res.status(204).send();
  };
}
