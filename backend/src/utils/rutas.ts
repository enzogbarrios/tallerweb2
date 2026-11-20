import { fileURLToPath } from 'node:url';

// Raiz de backend/ tanto con tsx (src/) como con la build (dist/).
// Así escribir, servir y migrar archivos apuntan siempre al mismo lugar.
export const RAIZ_BACKEND = fileURLToPath(new URL('../../', import.meta.url));
