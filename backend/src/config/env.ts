// Lee las variables del archivo .env y las deja tipadas para el resto del backend.
// Si falta alguna variable obligatoria, el servidor no arranca y avisa cuál es.
import 'dotenv/config';
import env from 'env-var';

export const config = {
  port: env.get('PORT').required().asPortNumber(),
  db: {
    host: env.get('DB_HOST').required().asString(),
    port: env.get('DB_PORT').required().asPortNumber(),
    user: env.get('DB_USER').required().asString(),
    password: env.get('DB_PASSWORD').required().asString(),
    database: env.get('DB_NAME').required().asString(),
  },
  jwtSecret: env.get('JWT_SECRET').required().asString(),
  frontendUrl: env
    .get('FRONTEND_URL')
    .default('http://localhost:4200')
    .asString()
    .replace(/\/+$/, ''),
  smtp: {
    host: env.get('SMTP_HOST').asString(),
    port: env.get('SMTP_PORT').default(587).asPortNumber(),
    user: env.get('SMTP_USER').asString(),
    pass: env.get('SMTP_PASS').asString(),
  },
  mailFrom: env.get('MAIL_FROM').default('Shaka <no-responder@shaka.local>').asString(),
};
