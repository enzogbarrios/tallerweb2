# tallerweb2

Tienda online de indumentaria **Shaka**. El proyecto está separado en dos carpetas independientes:

- `backend/`: API REST con Express, TypeScript y PostgreSQL.
- `frontend/`: aplicación Angular con Tailwind, signals y RxJS.

Cada carpeta tiene su propio `package.json` y se instala y ejecuta por separado.

## Puesta en marcha

Backend:

```bash
cd backend
npm install
npm run migrate   # aplica las migraciones
npm run seed      # datos de desarrollo (opcional)
npm run dev       # http://localhost:3000
```

Frontend:

```bash
cd frontend
npm install
npm start         # http://localhost:4200
```

El frontend redirige `/api` y `/uploads` al puerto 3000 mediante `proxy.conf.json`.

`GET /api/productos`, `GET /api/categorias`, `GET /api/pedidos` y `GET /api/pedidos/todos` devuelven los listados completos; el frontend filtra, ordena y pagina en memoria el catálogo, los paneles de administración, Mis pedidos y Ventas. `/api/pedidos/todos` es solo admin e incluye los datos del comprador; se carga recién al abrir Ventas, no al arrancar la app. El resumen de Ventas (ventas y total facturado, sin contar canceladas) también se calcula en el cliente. Ninguno de estos listados sincroniza filtros con la URL: al recargar se reinician.

## Usuarios de prueba

- Admin: `admin@shaka.com` / `Shaka1234!`
- Cliente: `demo@shaka.com` / `Shaka1234!`

## Comandos útiles

```bash
cd backend && npm run build && npm run typecheck
cd frontend && npm run build && npm test
```

La configuración de editor (`.editorconfig`, `.prettierrc`) está en la raíz y aplica a ambas carpetas.
