import { join } from 'node:path';
import express from 'express';
import helmet from 'helmet';
import { query } from './db/pool.js';
import { errorHandler, rutaNoEncontrada } from './middlewares/errorHandler.js';
import { authRoutes } from './routes/auth.routes.js';
import { carritoRoutes } from './routes/carrito.routes.js';
import { categoriasRoutes } from './routes/categorias.routes.js';
import { pedidosRoutes } from './routes/pedidos.routes.js';
import { productosRoutes } from './routes/productos.routes.js';
import { RAIZ_BACKEND } from './utils/rutas.js';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // cabeceras de seguridad
app.use(express.json({ limit: '100kb' })); // permite leer el body en formato JSON

// Ruta de prueba: confirma que el servidor y la base de datos andan.
app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// Las imágenes de productos se sirven como archivos estáticos: /uploads/productos/xxx.webp
app.use('/uploads', express.static(join(RAIZ_BACKEND, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/productos', productosRoutes);

// Siempre al final: lo que no coincidió con ninguna ruta y los errores.
app.use(rutaNoEncontrada);
app.use(errorHandler);
