import type { Request, Response } from 'express';
import { CarritoRepository } from '../repository/carrito.repository.js';
import { ProductosRepository } from '../repository/productos.repository.js';
import type { CantidadDto } from '../schemas/carrito.schemas.js';
import { CarritoService } from '../services/carrito.service.js';
import { idNumerico } from '../utils/validarId.js';

const carritoService = new CarritoService(new CarritoRepository(), new ProductosRepository());

export class CarritoController {
  public listar = async (req: Request, res: Response) => {
    const carrito = await carritoService.obtener(req.usuario!.id);
    return res.json(carrito);
  };

  public actualizarItem = async (req: Request, res: Response) => {
    const varianteId = idNumerico(req.params.varianteId);
    const { cantidad } = req.body as CantidadDto;

    const carrito = await carritoService.actualizarItem(req.usuario!.id, varianteId, cantidad);
    return res.json(carrito);
  };

  public quitarItem = async (req: Request, res: Response) => {
    const varianteId = idNumerico(req.params.varianteId);
    const carrito = await carritoService.quitarItem(req.usuario!.id, varianteId);
    return res.json(carrito);
  };

  public vaciar = async (req: Request, res: Response) => {
    const carrito = await carritoService.vaciar(req.usuario!.id);
    return res.json(carrito);
  };
}
