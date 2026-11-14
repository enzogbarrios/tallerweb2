# Shaka — Taller Web 2

Tienda online de ropa (clon de Shaka) hecha para el trabajo práctico de Taller Web 2.

- **Frontend:** Angular 22 + Tailwind CSS 4 (carpeta `src/`).
- **Backend:** Node.js + Express (carpeta `backend/`).
- **Base de datos:** PostgreSQL.

Qué se puede hacer hoy: registrarse, iniciar sesión (la sesión se mantiene al recargar), recuperar contraseña (respuesta genérica, todavía no manda mails) y ver el catálogo de productos que sale de la base de datos. El carrito, los pedidos y el panel de administrador existen en pantalla pero todavía trabajan en memoria (se pierden al recargar); se van a conectar a la base en las próximas etapas.

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

Son **dos** `npm install`: uno para el frontend (en la raíz) y otro para el backend.

```bash
npm install
cd backend
npm install
```

---

## 4. Crear las bases de datos

Hacen falta dos bases: `shaka` (la que usa la app) y `shaka_test` (la que usan los tests, para no pisar tus datos).

Desde una terminal, con `psql` (te va a pedir la contraseña de `postgres`):

```bash
psql -U postgres -h localhost -c "CREATE DATABASE shaka;" -c "CREATE DATABASE shaka_test;"
```

Si `psql` no se reconoce como comando, agregá la carpeta `bin` de PostgreSQL al PATH (por ejemplo `C:\Program Files\PostgreSQL\18\bin`) o creá las dos bases desde pgAdmin.

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
```

---

## 6. Crear las tablas y cargar los datos

Siempre dentro de la carpeta `backend/`:

```bash
npm run migrate
npm run seed
```

- `migrate` crea las tablas.
- `seed` carga 2 usuarios y los 23 productos (copia las fotos de `public/img/productos` a `backend/uploads/productos`).

> **Cuidado:** `npm run seed` borra todo lo que haya en las tablas y vuelve a cargar los datos de ejemplo. Usalo solo para empezar de cero.

---

## 7. Levantar la aplicación

Hacen falta **dos terminales abiertas a la vez**.

**Terminal 1 — backend** (desde `backend/`):

```bash
npm run dev
```

Tiene que decir `Backend escuchando en http://localhost:3000`.

**Terminal 2 — frontend** (desde la raíz del proyecto):

```bash
npm start
```

Después abrí **http://localhost:4200** en el navegador.

Para comprobar que el backend y la base están conectados, entrá a http://localhost:4200/api/health: tiene que responder `{"status":"ok","db":"connected"}`.

---

## 8. Usuarios de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Cliente | `demo@shaka.com` | `Shaka1234!` |
| Administrador | `admin@shaka.com` | `Shaka1234!` |

También podés crear tu propia cuenta desde "Registrarse". La contraseña tiene que tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.

---

## 9. Correr los tests del backend (opcional)

Los tests usan la base `shaka_test`. La primera vez hay que crearle las tablas.

En **PowerShell**:

```powershell
cd backend
$env:DB_NAME="shaka_test"; npm run migrate
Remove-Item Env:DB_NAME
npm test
```

En **Git Bash / Linux / Mac**:

```bash
cd backend
DB_NAME=shaka_test npm run migrate
npm test
```

---

## Estructura del proyecto

```
tallerweb2/
├─ src/                 Frontend Angular (páginas, servicios, guards, modelos)
├─ public/              Archivos estáticos del front (logo, hero, fotos originales)
├─ proxy.conf.json      Reenvía /api y /uploads del front al backend (puerto 3000)
└─ backend/
   ├─ .env.example      Plantilla de configuración (copiar a .env)
   ├─ uploads/          Fotos de productos (se genera con el seed, no va a git)
   ├─ src/
   │  ├─ server.js      Arranca el servidor
   │  ├─ app.js         Arma Express: middlewares y rutas
   │  ├─ config/        Lectura del .env
   │  ├─ db/            Conexión, migraciones (.sql) y seed
   │  ├─ routes/        Qué URLs existen
   │  ├─ controllers/   Qué responde cada URL
   │  ├─ repositories/  Las consultas SQL
   │  ├─ middlewares/   Validación, autenticación y manejo de errores
   │  └─ utils/         Errores, JWT y nombres de imágenes
   └─ test/             Tests de integración
```

Cada pedido pasa por estas capas: **ruta → middleware → controller → repository → base de datos**. Así cada archivo hace una sola cosa.

---

## Problemas comunes

| Síntoma | Causa probable |
|---|---|
| `password authentication failed for user "postgres"` | La contraseña de `DB_PASSWORD` en `backend/.env` no es la de tu PostgreSQL. |
| `Falta la variable ... en el archivo .env` | No creaste el `.env` o le falta alguna variable (ver paso 5). |
| `database "shaka" does not exist` | Falta crear las bases (paso 4). |
| `relation "usuarios" does not exist` | Falta correr `npm run migrate` (paso 6). |
| El catálogo aparece vacío o las fotos no cargan | El backend no está corriendo (terminal 1) o falta `npm run seed`. |
| `EADDRINUSE` (puerto en uso) | Ya hay algo usando el puerto 3000 (backend) o 4200 (front). Cerrá el proceso anterior. |
