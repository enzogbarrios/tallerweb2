import type { Request, Response } from 'express';
import { CategoriasRepository } from '../repository/categorias.repository.js';
import { ProductosRepository } from '../repository/productos.repository.js';
import { esquemaFiltrosProductos, type ProductoDto } from '../schemas/productos.schemas.js';
import { ProductosService } from '../services/productos.service.js';
import { ErrorApi } from '../utils/errores.js';
import { leerQuery } from '../utils/paginacion.js';
import { idNumerico } from '../utils/validarId.js';

const productosService = new ProductosService(
  new ProductosRepository(),
  new CategoriasRepository(),
);

export class ProductosController {
  public listar = async (_req: Request, res: Response) => {
    return res.json(await productosService.listar());
  };

  public listarAdmin = async (req: Request, res: Response) => {
    const filtros = leerQuery(esquemaFiltrosProductos, req.query);
    return res.json(await productosService.listarAdmin(filtros));
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
