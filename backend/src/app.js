// Arma la aplicación Express: middlewares y rutas. No arranca el servidor (eso lo hace server.js).
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import { query } from './db/pool.js';
import { errorHandler, rutaNoEncontrada } from './middlewares/errorHandler.js';
import { authRoutes } from './routes/auth.routes.js';
import { productosRoutes } from './routes/productos.routes.js';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // cabeceras de seguridad
app.use(express.json({ limit: '100kb' })); // permite leer el body en formato JSON

// Ruta de prueba: confirma que el servidor y la base de datos andan.
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// Las imágenes de productos se sirven como archivos estáticos: /uploads/productos/xxx.webp
app.use('/uploads', express.static(fileURLToPath(new URL('../uploads', import.meta.url))));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);

// Siempre al final: lo que no coincidió con ninguna ruta y los errores.
app.use(rutaNoEncontrada);
app.use(errorHandler);
