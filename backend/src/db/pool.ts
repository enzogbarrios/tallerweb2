// Conexión a PostgreSQL. Un "pool" es un grupo de conexiones que se reutilizan,
// así no abrimos una conexión nueva en cada consulta.
import pg from 'pg';
import { config } from '../config/env.js';

export const pool = new pg.Pool(config.db);

// Lo mínimo que usamos del resultado de una consulta. Tipamos las filas con T.
export type ResultadoConsulta<T> = {
  rows: T[];
  rowCount: number | null;
};

// Atajo para hacer consultas tipadas:
// query<Producto>('SELECT * FROM productos WHERE id = $1', [5])
export function query<T>(texto: string, parametros: unknown[] = []): Promise<ResultadoConsulta<T>> {
  return pool.query(texto, parametros) as unknown as Promise<ResultadoConsulta<T>>;
}
