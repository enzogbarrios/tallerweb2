// Punto de entrada: levanta el servidor en el puerto configurado.
import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`Backend escuchando en http://localhost:${env.port}`);
});
