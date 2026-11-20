// Corre los archivos .sql de la carpeta migrations, en orden, una sola vez cada uno.
// Se usa con: npm run migrate
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { RAIZ_BACKEND } from '../utils/rutas.js';
import { pool, query } from './pool.js';

const carpeta = join(RAIZ_BACKEND, 'src', 'db', 'migrations');

async function migrar() {
  // Tabla donde anotamos qué migraciones ya se aplicaron.
  await query(`
    CREATE TABLE IF NOT EXISTS migraciones (
      nombre TEXT PRIMARY KEY,
      aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const aplicadas = (await query<{ nombre: string }>('SELECT nombre FROM migraciones')).rows.map(
    (fila) => fila.nombre,
  );
  const archivos = (await readdir(carpeta)).filter((nombre) => nombre.endsWith('.sql')).sort();

  for (const archivo of archivos) {
    if (aplicadas.includes(archivo)) continue;

    const sql = await readFile(join(carpeta, archivo), 'utf8');
    const cliente = await pool.connect();
    try {
      // Si algo falla, el ROLLBACK deshace todo y no queda la migración a medias.
      await cliente.query('BEGIN');
      await cliente.query(sql);
      await cliente.query('INSERT INTO migraciones (nombre) VALUES ($1)', [archivo]);
      await cliente.query('COMMIT');
      console.log(`Migración aplicada: ${archivo}`);
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally {
      cliente.release();
    }
  }

  console.log('Base de datos al día.');
}

migrar()
  .catch((error: unknown) => {
    console.error('Error al migrar:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
