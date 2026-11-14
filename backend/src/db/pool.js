// Conexión a PostgreSQL. Un "pool" es un grupo de conexiones que se reutilizan,
// así no abrimos una conexión nueva en cada consulta.
import pg from 'pg';
import { env } from '../config/env.js';

export const pool = new pg.Pool(env.db);

// Atajo para hacer consultas: query('SELECT * FROM productos WHERE id = $1', [5])
export function query(texto, parametros) {
  return pool.query(texto, parametros);
}
