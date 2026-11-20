// Carga datos iniciales: 2 usuarios, 10 categorías y 23 productos (copiando sus imágenes a backend/uploads).
// Se usa con: npm run seed
// OJO: borra lo que haya en las tablas y vuelve a cargar todo desde cero (solo para desarrollo).
import { copyFile, mkdir, rm } from 'node:fs/promises';
import { extname, join } from 'node:path';
import bcrypt from 'bcryptjs';
import type { NuevaCategoria } from '../models/categoria.model.js';
import type { Rol } from '../models/usuario.model.js';
import { nombreDeImagen } from '../utils/imagenes.js';
import { RAIZ_BACKEND } from '../utils/rutas.js';
import { pool, query } from './pool.js';

// Las imágenes originales están en el front; las copiamos al backend.
const carpetaOrigen = join(RAIZ_BACKEND, '..', 'frontend', 'public', 'img', 'productos');
const carpetaDestino = join(RAIZ_BACKEND, 'uploads', 'productos');

type UsuarioSeed = {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  direccion: string;
  rol: Rol;
};

type ProductoSeed = {
  nombre: string;
  descripcion: string;
  clasificacion: string;
  precio: number;
  archivo: string;
  destacado: boolean;
};

const usuarios: UsuarioSeed[] = [
  { email: 'demo@shaka.com', password: 'Shaka1234!', nombre: 'Demo', apellido: 'Shaka', direccion: 'Calle 123', rol: 'cliente' },
  { email: 'admin@shaka.com', password: 'Shaka1234!', nombre: 'Admin', apellido: 'Shaka', direccion: 'Calle 123', rol: 'admin' },
];

const categorias: NuevaCategoria[] = [
  { nombre: 'Remeras', descripcion: 'Remeras de algodón de manga corta y larga.' },
  { nombre: 'Jeans', descripcion: 'Jeans de calce amplio en distintos lavados.' },
  { nombre: 'Bermudas', descripcion: 'Bermudas largas de denim y algodón.' },
  { nombre: 'Shorts', descripcion: 'Shorts y boardshorts livianos para el verano.' },
  { nombre: 'Sweaters', descripcion: 'Sweaters tejidos de punto grueso.' },
  { nombre: 'Camisas', descripcion: 'Camisas de manga corta y larga.' },
  { nombre: 'Buzos', descripcion: 'Buzos con y sin cierre, con interior suave.' },
  { nombre: 'Camperas', descripcion: 'Camperas de canvas y abrigos de estilo workwear.' },
  { nombre: 'Accesorios', descripcion: 'Gorras, cintos y otros complementos.' },
  { nombre: 'Polos', descripcion: 'Polos de punto con cuello clásico.' },
];

const TALLES_ROPA = ['S', 'M', 'L', 'XL'];
const TALLES_PANTALON = ['38', '40', '42', '44'];

const TALLES_POR_CATEGORIA: Record<string, string[]> = {
  Remeras: TALLES_ROPA,
  Sweaters: TALLES_ROPA,
  Camisas: TALLES_ROPA,
  Buzos: TALLES_ROPA,
  Camperas: TALLES_ROPA,
  Polos: TALLES_ROPA,
  Jeans: TALLES_PANTALON,
  Bermudas: TALLES_PANTALON,
  Shorts: ['S', 'M', 'L'],
};

// "archivo" es el nombre de la imagen original en public/img/productos.
const productos: ProductoSeed[] = [
  { nombre: 'Remera Ranglan Rosa', descripcion: 'Remera ranglan de algodón en color rosa, calce relajado y cuello redondo.', clasificacion: 'Remeras', precio: 70000, archivo: 'remera-ranglan-rosa.webp', destacado: true },
  { nombre: 'Remera Easy Negra', descripcion: 'Remera básica negra de algodón, calce clásico para el uso diario.', clasificacion: 'Remeras', precio: 63000, archivo: 'remera-negra.webp', destacado: true },
  { nombre: 'Remera Gris Topo', descripcion: 'Remera de algodón en gris topo con calce amplio y costuras reforzadas.', clasificacion: 'Remeras', precio: 70000, archivo: 'remera-gris-topo.webp', destacado: false },
  { nombre: 'Remera Manga Larga Lima', descripcion: 'Remera de manga larga en color lima, liviana y cómoda para entretiempo.', clasificacion: 'Remeras', precio: 95000, archivo: 'remera-manga-larga-lima.webp', destacado: false },
  { nombre: 'Sweater Basic Rojo', descripcion: 'Sweater tejido de punto grueso en color rojo, cálido y de calce holgado.', clasificacion: 'Sweaters', precio: 135000, archivo: 'sweater-rojo.webp', destacado: true },
  { nombre: 'Sweater Basic Negro', descripcion: 'Sweater tejido de punto grueso en color negro, un básico para el invierno.', clasificacion: 'Sweaters', precio: 135000, archivo: 'sweater-negro.webp', destacado: false },
  { nombre: 'Sweater Basic Crudo', descripcion: 'Sweater tejido de punto grueso en color crudo, suave y abrigado.', clasificacion: 'Sweaters', precio: 135000, archivo: 'sweater-crudo.webp', destacado: false },
  { nombre: 'Sweater Rayas Verde', descripcion: 'Sweater tejido con rayas en tonos verdes y calce oversize.', clasificacion: 'Sweaters', precio: 135000, archivo: 'sweater-rayas-verde.webp', destacado: false },
  { nombre: 'Bermuda Jort Negra', descripcion: 'Bermuda estilo jort en denim negro, larga y de calce holgado.', clasificacion: 'Bermudas', precio: 115000, archivo: 'bermuda-jort-negra.webp', destacado: false },
  { nombre: 'Bermuda Jort Gris', descripcion: 'Bermuda estilo jort en gris melange, cómoda y de calce amplio.', clasificacion: 'Bermudas', precio: 115000, archivo: 'bermuda-jort-gris.webp', destacado: false },
  { nombre: 'Short Boardshort Azul', descripcion: 'Short boardshort vintage en color azul, liviano y de secado rápido.', clasificacion: 'Shorts', precio: 95000, archivo: 'short-boardshort-azul.webp', destacado: false },
  { nombre: 'Short Boardshort Rojo', descripcion: 'Short boardshort vintage en color rojo, ideal para el verano.', clasificacion: 'Shorts', precio: 95000, archivo: 'short-boardshort-rojo.webp', destacado: false },
  { nombre: 'Gorra Marrón', descripcion: 'Gorra con visera curva y cierre ajustable en color marrón.', clasificacion: 'Accesorios', precio: 65000, archivo: 'gorra-marron.webp', destacado: false },
  { nombre: 'Gorra Rosa', descripcion: 'Gorra con visera curva y cierre ajustable en color rosa.', clasificacion: 'Accesorios', precio: 65000, archivo: 'gorra-rosa.webp', destacado: false },
  { nombre: 'Gorra Negra', descripcion: 'Gorra negra con visera curva y cierre ajustable, combina con todo.', clasificacion: 'Accesorios', precio: 65000, archivo: 'gorra-negra.webp', destacado: false },
  { nombre: 'Jean Azul Stone', descripcion: 'Jean de calce amplio en azul stone con paneles y costuras marcadas.', clasificacion: 'Jeans', precio: 135000, archivo: 'jean-azul.webp', destacado: true },
  { nombre: 'Jean Negro Lavado', descripcion: 'Jean de calce amplio en negro lavado con detalle de rayas.', clasificacion: 'Jeans', precio: 112000, archivo: 'jean-negro-lavado.webp', destacado: false },
  { nombre: 'Campera Canvas Crudo', descripcion: 'Campera de canvas en color crudo, resistente y de estilo workwear.', clasificacion: 'Camperas', precio: 116000, archivo: 'campera-canvas-crudo.webp', destacado: false },
  { nombre: 'Buzo con Cierre Negro', descripcion: 'Buzo con cierre frontal en color negro, de algodón con interior suave.', clasificacion: 'Buzos', precio: 145000, archivo: 'buzo-zip-negro.webp', destacado: false },
  { nombre: 'Buzo con Cierre Gris', descripcion: 'Buzo con cierre frontal en gris melange, de algodón con interior suave.', clasificacion: 'Buzos', precio: 145000, archivo: 'buzo-zip-gris.webp', destacado: false },
  { nombre: 'Polo Negro', descripcion: 'Polo negro de punto con cuello clásico y calce relajado.', clasificacion: 'Polos', precio: 95000, archivo: 'polo-negro.webp', destacado: false },
  { nombre: 'Camisa Verde', descripcion: 'Camisa manga corta con diseño a cuadros en color verde.', clasificacion: 'Camisas', precio: 85000, archivo: 'camisa-verde.webp', destacado: false },
  { nombre: 'Cinto Negro', descripcion: 'Cinto negro con hebilla metálica, resistente y fácil de combinar.', clasificacion: 'Accesorios', precio: 90000, archivo: 'cinto-negro.webp', destacado: false },
];

async function cargarDatos() {
  // 1. Vaciamos las tablas y reiniciamos los ids (CASCADE también vacía las que dependen de estas).
  await query(
    'TRUNCATE usuarios, categorias, productos, carrito_items, pedidos, pedido_items RESTART IDENTITY CASCADE',
  );

  // 2. Usuarios: guardamos la contraseña hasheada, nunca en texto plano.
  for (const usuario of usuarios) {
    const hash = await bcrypt.hash(usuario.password, 10);
    await query(
      'INSERT INTO usuarios (email, password_hash, nombre, apellido, direccion, rol) VALUES ($1, $2, $3, $4, $5, $6)',
      [usuario.email, hash, usuario.nombre, usuario.apellido, usuario.direccion, usuario.rol],
    );
  }

  const idPorCategoria = new Map<string, number>();
  for (const categoria of categorias) {
    const resultado = await query<{ id: number }>(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING id',
      [categoria.nombre, categoria.descripcion],
    );
    const fila = resultado.rows[0];
    if (fila) idPorCategoria.set(categoria.nombre, fila.id);
  }

  // 3. Imágenes: recreamos la carpeta de destino y copiamos cada archivo con su nombre nuevo.
  await rm(carpetaDestino, { recursive: true, force: true });
  await mkdir(carpetaDestino, { recursive: true });

  let variantesCargadas = 0;

  for (const [indice, producto] of productos.entries()) {
    const categoriaId = idPorCategoria.get(producto.clasificacion);
    if (categoriaId === undefined) {
      throw new Error(`La categoría "${producto.clasificacion}" no está en la lista del seed`);
    }

    const nombreNuevo = nombreDeImagen(producto.nombre, extname(producto.archivo));
    await copyFile(join(carpetaOrigen, producto.archivo), join(carpetaDestino, nombreNuevo));

    const insertado = await query<{ id: number }>(
      'INSERT INTO productos (nombre, descripcion, categoria_id, precio, imagen, destacado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [
        producto.nombre,
        producto.descripcion,
        categoriaId,
        producto.precio,
        `uploads/productos/${nombreNuevo}`,
        producto.destacado,
      ],
    );
    const productoId = insertado.rows[0]?.id;
    if (productoId === undefined) throw new Error(`No se pudo crear "${producto.nombre}"`);

    const talles = TALLES_POR_CATEGORIA[producto.clasificacion] ?? [''];
    for (const [indiceTalle, talle] of talles.entries()) {
      const stock = talle === '' ? 8 : (indice * 5 + indiceTalle * 3) % 9;
      await query(
        'INSERT INTO producto_variantes (producto_id, talle, color, stock) VALUES ($1, $2, $3, $4)',
        [productoId, talle, '', stock],
      );
      variantesCargadas++;
    }
  }

  console.log(
    `Seed listo: ${usuarios.length} usuarios, ${categorias.length} categorías, ${productos.length} productos y ${variantesCargadas} variantes.`,
  );
}

cargarDatos()
  .catch((error: unknown) => {
    console.error('Error en el seed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
