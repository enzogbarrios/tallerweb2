CREATE TABLE producto_variantes (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  talle       TEXT NOT NULL DEFAULT '',
  color       TEXT NOT NULL DEFAULT '',
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX producto_variantes_unica
  ON producto_variantes (producto_id, lower(talle), lower(color));

CREATE INDEX producto_variantes_producto_idx ON producto_variantes (producto_id);

INSERT INTO producto_variantes (producto_id, stock)
SELECT id, 10 FROM productos;

ALTER TABLE carrito_items
  ADD COLUMN variante_id INTEGER REFERENCES producto_variantes(id) ON DELETE CASCADE;

UPDATE carrito_items ci
SET variante_id = v.id
FROM producto_variantes v
WHERE v.producto_id = ci.producto_id;

ALTER TABLE carrito_items ALTER COLUMN variante_id SET NOT NULL;
ALTER TABLE carrito_items DROP CONSTRAINT carrito_items_pkey;
ALTER TABLE carrito_items ADD PRIMARY KEY (usuario_id, variante_id);

ALTER TABLE pedido_items
  ADD COLUMN variante_id INTEGER REFERENCES producto_variantes(id) ON DELETE SET NULL,
  ADD COLUMN talle TEXT NOT NULL DEFAULT '',
  ADD COLUMN color TEXT NOT NULL DEFAULT '';

UPDATE pedido_items pi
SET variante_id = v.id
FROM producto_variantes v
WHERE v.producto_id = pi.producto_id;
