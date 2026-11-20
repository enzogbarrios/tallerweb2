// si alguna consulta falla tira rollback
import type { PoolClient } from 'pg';
import { pool } from './pool.js';

export async function enTransaccion<T>(fn: (cliente: PoolClient) => Promise<T>) {
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');
    const resultado = await fn(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
