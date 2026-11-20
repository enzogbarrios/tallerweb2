import type { PoolClient } from 'pg';
import { query } from '../db/pool.js';
import { enTransaccion } from '../db/transaccion.js';

type TokenVigente = { id: number; usuario_id: number };

const CONDICION_VIGENTE = 'token_hash = $1 AND usado_en IS NULL AND vence_en > now()';

export class RecuperacionRepository {
  async reemplazar(usuarioId: number, tokenHash: string, venceEn: Date) {
    await enTransaccion(async (cliente: PoolClient) => {
      await cliente.query('DELETE FROM tokens_recuperacion WHERE usuario_id = $1', [usuarioId]);
      await cliente.query(
        `INSERT INTO tokens_recuperacion (usuario_id, token_hash, vence_en) VALUES ($1, $2, $3)`,
        [usuarioId, tokenHash, venceEn],
      );
    });
  }

  async buscarVigente(tokenHash: string) {
    const resultado = await query<TokenVigente>(
      `SELECT id, usuario_id FROM tokens_recuperacion WHERE ${CONDICION_VIGENTE}`,
      [tokenHash],
    );
    return resultado.rows[0];
  }

  async restablecerPassword(tokenHash: string, passwordHash: string) {
    return await enTransaccion(async (cliente: PoolClient) => {
      const resultado = await cliente.query<TokenVigente>(
        `SELECT id, usuario_id FROM tokens_recuperacion WHERE ${CONDICION_VIGENTE} FOR UPDATE`,
        [tokenHash],
      );
      const token = resultado.rows[0];
      if (!token) return false;

      await cliente.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [
        passwordHash,
        token.usuario_id,
      ]);
      await cliente.query(
        'UPDATE tokens_recuperacion SET usado_en = now() WHERE usuario_id = $1 AND usado_en IS NULL',
        [token.usuario_id],
      );
      return true;
    });
  }
}
