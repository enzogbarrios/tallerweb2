import pg from 'pg';
import { config } from '../config/env.js';

export const pool = new pg.Pool(config.db);

export type ResultadoConsulta<T> = {
  rows: T[];
  rowCount: number | null;
};

export async function query<T>(texto: string, parametros: unknown[] = []) {
  return pool.query(texto, parametros) as unknown as ResultadoConsulta<T>;
}
