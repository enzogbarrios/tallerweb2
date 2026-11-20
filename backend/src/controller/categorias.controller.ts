import type { Request, Response } from 'express';
import { CategoriasRepository } from '../repository/categorias.repository.js';
import { type CategoriaDto, esquemaListadoCategorias } from '../schemas/categorias.schemas.js';
import { CategoriasService } from '../services/categorias.service.js';
import { leerQuery } from '../utils/paginacion.js';
import { idNumerico } from '../utils/validarId.js';

const categoriasService = new CategoriasService(new CategoriasRepository());

export class CategoriasController {
  public listar = async (_req: Request, res: Response) => {
    return res.json(await categoriasService.listar());
  };

  public listarAdmin = async (req: Request, res: Response) => {
    const filtros = leerQuery(esquemaListadoCategorias, req.query);
    return res.json(await categoriasService.listarPaginado(filtros));
  };

  public crear = async (req: Request, res: Response) => {
    const categoria = await categoriasService.crear(req.body as CategoriaDto);
    return res.status(201).json(categoria);
  };

  public actualizar = async (req: Request, res: Response) => {
    const id = idNumerico(req.params.id);
    const categoria = await categoriasService.actualizar(id, req.body as CategoriaDto);
    return res.json(categoria);
  };

  public eliminar = async (req: Request, res: Response) => {
    const id = idNumerico(req.params.id);
    await categoriasService.eliminar(id);
    return res.status(204).send();
  };
}
