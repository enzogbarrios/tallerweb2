import type { CategoriasRepository } from '../repository/categorias.repository.js';
import type { CategoriaDto, ListadoCategoriasDto } from '../schemas/categorias.schemas.js';
import { codigoDeError, ErrorApi } from '../utils/errores.js';
import { armarPagina } from '../utils/paginacion.js';

function nombreDuplicado() {
  return new ErrorApi(409, 'CATEGORIA_DUPLICADA', 'Ya existe una categoría con ese nombre.', {
    nombre: 'Ya existe una categoría con ese nombre.',
  });
}

function noEncontrada() {
  return new ErrorApi(404, 'CATEGORIA_NO_ENCONTRADA', 'La categoría no existe.');
}

function conProductos(nombre: string, cantidad?: number) {
  const detalle =
    cantidad === undefined
      ? 'tiene productos asociados'
      : `tiene ${cantidad} ${cantidad === 1 ? 'producto asociado' : 'productos asociados'}`;

  return new ErrorApi(
    409,
    'CATEGORIA_CON_PRODUCTOS',
    `No se puede eliminar "${nombre}" porque ${detalle}. Primero pasalos a otra categoría.`,
  );
}

export class CategoriasService {
  private readonly categorias: CategoriasRepository;

  constructor(categorias: CategoriasRepository) {
    this.categorias = categorias;
  }

  async listar() {
    return await this.categorias.listar();
  }

  async listarPaginado(filtros: ListadoCategoriasDto) {
    const { items, total } = await this.categorias.listarPaginado(filtros);
    return armarPagina(items, total, filtros.pagina, filtros.limite);
  }

  async obtener(id: number) {
    const categoria = await this.categorias.buscarPorId(id);

    if (!categoria) {
      throw noEncontrada();
    }
    return categoria;
  }

  async crear(datos: CategoriaDto) {
    try {
      const categoria = await this.categorias.crear(datos);

      if (!categoria) {
        throw new Error('No se pudo crear la categoría');
      }
      return categoria;
    } catch (error) {
      if (codigoDeError(error) === '23505') throw nombreDuplicado();
      throw error;
    }
  }

  async actualizar(id: number, datos: CategoriaDto) {
    try {
      const categoria = await this.categorias.actualizar(id, datos);

      if (!categoria) {
        throw noEncontrada();
      }
      return categoria;
    } catch (error) {
      if (codigoDeError(error) === '23505') throw nombreDuplicado();
      throw error;
    }
  }

  async eliminar(id: number) {
    const categoria = await this.obtener(id);

    const cantidad = await this.categorias.contarProductos(id);
    if (cantidad > 0) {
      throw conProductos(categoria.nombre, cantidad);
    }

    try {
      await this.categorias.eliminar(id);
    } catch (error) {
      if (codigoDeError(error) === '23503') throw conProductos(categoria.nombre);
      throw error;
    }
    return categoria;
  }
}
