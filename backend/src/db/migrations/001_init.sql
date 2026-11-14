-- Esquema inicial de Shaka.

CREATE TABLE usuarios (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  apellido      TEXT NOT NULL,
  direccion     TEXT NOT NULL,
  rol           TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un mismo email no puede repetirse, sin importar mayúsculas.
CREATE UNIQUE INDEX usuarios_email_unico ON usuarios (lower(email));

CREATE TABLE productos (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre        TEXT NOT NULL,
  descripcion   TEXT NOT NULL,
  clasificacion TEXT NOT NULL CHECK (clasificacion IN
                  ('Remeras','Jeans','Bermudas','Shorts','Sweaters',
                   'Camisas','Buzos','Camperas','Accesorios','Polos')),
  precio        INTEGER NOT NULL CHECK (precio > 0),
  imagen        TEXT NOT NULL,
  destacado     BOOLEAN NOT NULL DEFAULT false,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Carrito persistente por usuario (sobrevive a cerrar sesión).
CREATE TABLE carrito_items (
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad    INTEGER NOT NULL CHECK (cantidad > 0),
  PRIMARY KEY (usuario_id, producto_id)
);

CREATE TABLE pedidos (
  id              INTEGER GENERATED ALWAYS AS IDENTITY (START WITH 1001) PRIMARY KEY,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
  direccion_envio TEXT NOT NULL,
  subtotal        INTEGER NOT NULL,
  envio           INTEGER NOT NULL,
  total           INTEGER NOT NULL,
  estado          TEXT NOT NULL DEFAULT 'Confirmado'
                  CHECK (estado IN ('Confirmado','En preparación','Enviado','Entregado')),
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pedido_items (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id       INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id     INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  nombre          TEXT NOT NULL,
  clasificacion   TEXT NOT NULL,
  imagen          TEXT NOT NULL,
  precio_unitario INTEGER NOT NULL,
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0)
);
