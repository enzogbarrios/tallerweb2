import type { Request, Response } from 'express';
import { CarritoRepository } from '../repository/carrito.repository.js';
import { PedidosRepository } from '../repository/pedidos.repository.js';
import { ProductosRepository } from '../repository/productos.repository.js';
import type { PedidoDto } from '../schemas/pedidos.schemas.js';
import { CarritoService } from '../services/carrito.service.js';
import { PagosService } from '../services/pagos.service.js';
import { PedidosService } from '../services/pedidos.service.js';
import { idNumerico } from '../utils/validarId.js';

const carritoService = new CarritoService(new CarritoRepository(), new ProductosRepository());
const pedidosService = new PedidosService(carritoService, new PedidosRepository(), new PagosService());

export class PedidosController {
  public crear = async (req: Request, res: Response) => {
    const datos = req.body as PedidoDto;
    const pedido = await pedidosService.crear(req.usuario!.id, datos);
    return res.status(201).json(pedido);
  };

  public listar = async (req: Request, res: Response) => {
    const pedidos = await pedidosService.listar(req.usuario!.id, req.usuario!.rol);
    return res.json(pedidos);
  };

  public obtener = async (req: Request, res: Response) => {
    const pedidoId = idNumerico(req.params.id);
    const pedido = await pedidosService.obtener(req.usuario!.id, req.usuario!.rol, pedidoId);
    return res.json(pedido);
  };
}
