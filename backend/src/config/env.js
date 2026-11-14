// Lee las variables del archivo .env y las deja listas para usar en el resto del backend.
import 'dotenv/config';

const requeridas = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];

// Si falta alguna variable, el servidor no arranca y avisa cuál es.
for (const nombre of requeridas) {
  if (!process.env[nombre]) {
    throw new Error(`Falta la variable ${nombre} en el archivo .env`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  jwtSecret: process.env.JWT_SECRET,
};
