// Consultas SQL de la tabla usuarios. Es el único repository que "habla" con esta tabla.
import { query } from '../db/pool.js';
import type { NuevoUsuario, Usuario, UsuarioConPassword } from '../models/usuario.model.js';

// Estas son las columnas que se pueden mostrar. Nunca incluimos password_hash.
const COLUMNAS_PUBLICAS = 'id, email, nombre, apellido, direccion, rol';

export class UsuariosRepository {
  async crear({ email, passwordHash, nombre, apellido, direccion }: NuevoUsuario): Promise<Usuario> {
    const resultado = await query<Usuario>(
      `INSERT INTO usuarios (email, password_hash, nombre, apellido, direccion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNAS_PUBLICAS}`,
      [email, passwordHash, nombre, apellido, direccion],
    );

    const usuario = resultado.rows[0];
    if (!usuario) throw new Error('No se pudo crear el usuario');
    return usuario;
  }

  // Devuelve también password_hash porque se necesita para comparar al iniciar sesión.
  async buscarPorEmail(email: string): Promise<UsuarioConPassword | undefined> {
    const resultado = await query<UsuarioConPassword>(
      `SELECT ${COLUMNAS_PUBLICAS}, password_hash FROM usuarios WHERE lower(email) = lower($1)`,
      [email],
    );

    return resultado.rows[0];
  }

  async buscarPorId(id: number): Promise<Usuario | undefined> {
    const resultado = await query<Usuario>(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = $1`, [id]);
    return resultado.rows[0];
  }
}
