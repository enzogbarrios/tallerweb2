// Tests de signup, signin y me. Corren contra la base shaka_test, nunca contra shaka.
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

// Hay que elegir la base ANTES de importar la app (dotenv no pisa variables ya definidas).
process.env.DB_NAME = 'shaka_test';
const { app } = await import('../src/app.js');
const { pool } = await import('../src/db/pool.js');

let servidor;
let url;

const datosValidos = {
  email: 'nuevo@shaka.com',
  password: 'Clave1234!',
  nombre: 'Nuevo',
  apellido: 'Usuario',
  direccion: 'Calle 456',
};

// Atajo para llamar a la API y recibir { status, body }.
async function pedir(ruta, { metodo = 'GET', body, token } = {}) {
  const respuesta = await fetch(url + ruta, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  return { status: respuesta.status, body: await respuesta.json() };
}

before(async () => {
  servidor = app.listen(0);
  url = `http://localhost:${servidor.address().port}`;
});

beforeEach(async () => {
  await pool.query('TRUNCATE usuarios RESTART IDENTITY CASCADE');
});

after(async () => {
  servidor.close();
  await pool.end();
});

describe('POST /api/auth/signup', () => {
  it('crea el usuario, devuelve token y no muestra la contraseña', async () => {
    const { status, body } = await pedir('/api/auth/signup', { metodo: 'POST', body: datosValidos });
    assert.equal(status, 201);
    assert.ok(body.token);
    assert.equal(body.usuario.email, 'nuevo@shaka.com');
    assert.equal(body.usuario.rol, 'cliente');
    assert.equal(body.usuario.password, undefined);
    assert.equal(body.usuario.password_hash, undefined);
  });

  it('rechaza un email repetido aunque cambien las mayúsculas (409)', async () => {
    await pedir('/api/auth/signup', { metodo: 'POST', body: datosValidos });
    const { status, body } = await pedir('/api/auth/signup', {
      metodo: 'POST',
      body: { ...datosValidos, email: 'NUEVO@Shaka.com' },
    });
    assert.equal(status, 409);
    assert.equal(body.error.codigo, 'EMAIL_DUPLICADO');
  });

  it('rechaza una contraseña floja y dice qué campo falló (400)', async () => {
    const { status, body } = await pedir('/api/auth/signup', {
      metodo: 'POST',
      body: { ...datosValidos, password: 'abc' },
    });
    assert.equal(status, 400);
    assert.ok(body.error.campos.password);
  });

  it('rechaza si faltan datos (400)', async () => {
    const { status, body } = await pedir('/api/auth/signup', { metodo: 'POST', body: { email: 'a@a.com' } });
    assert.equal(status, 400);
    assert.ok(body.error.campos.nombre);
    assert.ok(body.error.campos.direccion);
  });
});

describe('POST /api/auth/signin', () => {
  it('inicia sesión con credenciales correctas', async () => {
    await pedir('/api/auth/signup', { metodo: 'POST', body: datosValidos });
    const { status, body } = await pedir('/api/auth/signin', {
      metodo: 'POST',
      body: { email: datosValidos.email, password: datosValidos.password },
    });
    assert.equal(status, 200);
    assert.ok(body.token);
  });

  it('da el mismo error si el email no existe o la contraseña está mal (401)', async () => {
    await pedir('/api/auth/signup', { metodo: 'POST', body: datosValidos });
    const mala = await pedir('/api/auth/signin', {
      metodo: 'POST',
      body: { email: datosValidos.email, password: 'OtraClave1!' },
    });
    const inexistente = await pedir('/api/auth/signin', {
      metodo: 'POST',
      body: { email: 'nadie@shaka.com', password: 'Clave1234!' },
    });
    assert.equal(mala.status, 401);
    assert.equal(inexistente.status, 401);
    assert.deepEqual(mala.body, inexistente.body);
  });
});

describe('GET /api/auth/me', () => {
  it('sin token devuelve 401', async () => {
    const { status } = await pedir('/api/auth/me');
    assert.equal(status, 401);
  });

  it('con un token inventado devuelve 401', async () => {
    const { status } = await pedir('/api/auth/me', { token: 'token-falso' });
    assert.equal(status, 401);
  });

  it('con un token válido devuelve el usuario', async () => {
    const registro = await pedir('/api/auth/signup', { metodo: 'POST', body: datosValidos });
    const { status, body } = await pedir('/api/auth/me', { token: registro.body.token });
    assert.equal(status, 200);
    assert.equal(body.usuario.email, 'nuevo@shaka.com');
  });
});
