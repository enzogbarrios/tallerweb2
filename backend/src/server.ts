import { app } from './app.js';
import { config } from './config/env.js';

app.listen(config.port, () => {
  console.log(`Backend escuchando en http://localhost:${config.port}`);
});
