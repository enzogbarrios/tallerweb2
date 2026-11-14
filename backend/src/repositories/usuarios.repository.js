// Consultas SQL de la tabla usuarios. Es el único archivo que "habla" con esta tabla.
import { query } from '../db/pool.js';

// Estas son las columnas que se pueden mostrar. Nunca incluimos password_hash.
const COLUMNAS_PUBLICAS = 'id, email, nombre, apellido, direccion, rol';

export async function crear({ email, passwordHash, nombre, apellido, direccion }) {
  const resultado = await query(
    `INSERT INTO usuarios (email, password_hash, nombre, apellido, direccion)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNAS_PUBLICAS}`,
    [email, passwordHash, nombre, apellido, direccion],
  );
  return resultado.rows[0];
}

// Devuelve también password_hash porque se necesita para comparar al iniciar sesión.
export async function buscarPorEmail(email) {
  const resultado = await query(
    `SELECT ${COLUMNAS_PUBLICAS}, password_hash FROM usuarios WHERE lower(email) = lower($1)`,
    [email],
  );
  return resultado.rows[0];
}

export async function buscarPorId(id) {
  const resultado = await query(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = $1`, [id]);
  return resultado.rows[0];
}
