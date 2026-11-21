# Shaka — Taller Web 2

Tienda online de indumentaria **Shaka** hecha para el trabajo práctico de Taller Web 2. El proyecto está separado en dos carpetas independientes:

- `frontend/`: aplicación Angular 22 + Tailwind CSS 4 (páginas, servicios, guards, modelos y signals).
- `backend/`: API REST con Node.js, Express, TypeScript y PostgreSQL.

Cada carpeta tiene su propio `package.json`: se instalan y se ejecutan por separado.

---

## 1. Qué necesitás instalar

| Programa | Versión | Para qué |
|---|---|---|
| [Node.js](https://nodejs.org) | 24 o superior | Correr el front y el backend |
| [PostgreSQL](https://www.postgresql.org/download/) | 16 o superior (se probó con 18) | La base de datos |
| [Git](https://git-scm.com) | cualquiera | Bajar el proyecto |

Durante la instalación de PostgreSQL te pide una contraseña para el usuario `postgres`. **Anotala**, la vas a necesitar en el paso 4.

---

## 2. Bajar el proyecto

```bash
git clone <URL-del-repositorio>
cd tallerweb2
```

---

## 3. Instalar las dependencias

Son **dos** `npm install`, uno por carpeta:

```bash
cd frontend && npm install
cd ../backend && npm install
cd ..
```

---

## 4. Crear la base de datos

Desde una terminal, con `psql` (te va a pedir la contraseña de `postgres`):

```bash
psql -U postgres -h localhost -c "CREATE DATABASE shaka;"
```

Si `psql` no se reconoce como comando, agregá la carpeta `bin` de PostgreSQL al PATH (por ejemplo `C:\Program Files\PostgreSQL\18\bin`) o creá la base desde pgAdmin.

---

## 5. Configurar el archivo `.env` del backend

El `.env` tiene datos privados (como tu contraseña de PostgreSQL), por eso **no está en el repositorio**. Hay que crearlo a partir del ejemplo:

```bash
# estando en la carpeta backend/
cp .env.example .env
```

En Windows con PowerShell o CMD: `copy .env.example .env`.

Abrí `backend/.env` y completá:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=la_contraseña_que_elegiste_al_instalar_postgres
DB_NAME=shaka
JWT_SECRET=cualquier_texto_largo_y_secreto

FRONTEND_URL=http://localhost:4200
```

Las variables de `SMTP_*` son opcionales: sin ellas los mails no se envían, pero el resto de la app funciona igual.

---

## 6. Crear las tablas y cargar los datos

Siempre dentro de la carpeta `backend/`:

```bash
npm run migrate
npm run seed
```

- `migrate` crea las tablas.
- `seed` carga 2 usuarios y los 23 productos (copia las fotos de `frontend/public/img/productos` a `backend/uploads/productos`).

> **Cuidado:** `npm run seed` borra todo lo que haya en las tablas y vuelve a cargar los datos de ejemplo. Usalo solo para empezar de cero.

---

## 7. Levantar la aplicación

Hacen falta **dos terminales abiertas a la vez**.

**Terminal 1 — backend** (desde `backend/`):

```bash
npm run dev
```

Tiene que decir `Backend escuchando en http://localhost:3000`.

**Terminal 2 — frontend** (desde `frontend/`):

```bash
npm start
```

Después abrí **http://localhost:4200** en el navegador. El proxy de `frontend/proxy.conf.json` redirige `/api` y `/uploads` al puerto 3000.

Para comprobar que el backend y la base están conectados, entrá a http://localhost:4200/api/health: tiene que responder `{"status":"ok","db":"connected"}`.

---

## 8. Usuarios de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Cliente | `demo@shaka.com` | `Shaka1234!` |
| Administrador | `admin@shaka.com` | `Shaka1234!` |

También podés crear tu propia cuenta desde "Registrarse". La contraseña tiene que tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.

---

## 9. Listados y paginación

`GET /api/productos`, `GET /api/categorias`, `GET /api/pedidos` y `GET /api/pedidos/todos` devuelven los listados completos. El frontend filtra, ordena y pagina en memoria el catálogo, los paneles de administración, Mis pedidos y Ventas.

`/api/pedidos/todos` es solo admin e incluye los datos del comprador; se carga recién al abrir Ventas, no al arrancar la app. El resumen de Ventas (cantidad y total facturado, sin contar canceladas) también se calcula en el cliente.

Ninguno de estos listados sincroniza filtros con la URL: al recargar se reinician.

---

## 10. Comandos útiles

```bash
cd backend && npm run build && npm run typecheck
cd frontend && npm run build && npm test
```

La configuración de editor (`.editorconfig`, `.prettierrc`) está en la raíz y aplica a ambas carpetas.

---

## Estructura del proyecto

```
tallerweb2/
├─ frontend/
│  ├─ proxy.conf.json     Reenvía /api y /uploads al backend (puerto 3000)
│  ├─ public/             Logo, hero y fotos originales de los productos
│  └─ src/app/
│     ├─ api/             Servicios HTTP, interceptores y manejo de errores
│     ├─ modules/         Páginas de productos, carrito, usuarios y admin
│     ├─ public/          Home, menú y footer
│     └─ shared/          Componentes, directivas, guards, modelos y utils
└─ backend/
   ├─ .env.example        Plantilla de configuración (copiar a .env)
   ├─ uploads/            Fotos de productos (la genera el seed, no va a git)
   └─ src/
      ├─ server.ts        Arranca el servidor
      ├─ app.ts           Arma Express: middlewares y rutas
      ├─ config/          Lectura del .env
      ├─ db/              Conexión, migraciones (.sql) y seed
      ├─ routes/          Qué URLs existen
      ├─ controller/      Qué responde cada URL
      ├─ services/        Reglas de negocio (stock, pagos, pedidos)
      ├─ repository/      Las consultas SQL
      ├─ schemas/         Validaciones con zod
      ├─ models/          Tipos y clases del dominio
      ├─ middlewares/     Validación, autenticación, imágenes y errores
      └─ utils/           JWT, errores, rutas y nombres de imágenes
```

Cada pedido pasa por estas capas: **ruta → middleware → controller → service → repository → base de datos**. Así cada archivo hace una sola cosa.

---

## Problemas comunes

| Síntoma | Causa probable |
|---|---|
| `password authentication failed for user "postgres"` | La contraseña de `DB_PASSWORD` en `backend/.env` no es la de tu PostgreSQL. |
| `Falta la variable ... en el archivo .env` | No creaste el `.env` o le falta alguna variable (ver paso 5). |
| `database "shaka" does not exist` | Falta crear la base (paso 4). |
| `relation "usuarios" does not exist` | Falta correr `npm run migrate` (paso 6). |
| El catálogo aparece vacío o las fotos no cargan | El backend no está corriendo (terminal 1) o falta `npm run seed`. |
| `EADDRINUSE` (puerto en uso) | Ya hay algo usando el puerto 3000 (backend) o 4200 (front). Cerrá el proceso anterior. |
