CREATE TABLE categorias (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre      TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX categorias_nombre_unico ON categorias (lower(nombre));

INSERT INTO categorias (nombre) VALUES
  ('Remeras'), ('Jeans'), ('Bermudas'), ('Shorts'), ('Sweaters'),
  ('Camisas'), ('Buzos'), ('Camperas'), ('Accesorios'), ('Polos');

INSERT INTO categorias (nombre)
SELECT DISTINCT p.clasificacion
FROM productos p
WHERE NOT EXISTS (SELECT 1 FROM categorias c WHERE lower(c.nombre) = lower(p.clasificacion));

ALTER TABLE productos
  ADD COLUMN categoria_id INTEGER REFERENCES categorias(id) ON DELETE RESTRICT;

UPDATE productos p
SET categoria_id = c.id
FROM categorias c
WHERE lower(c.nombre) = lower(p.clasificacion);

ALTER TABLE productos ALTER COLUMN categoria_id SET NOT NULL;

ALTER TABLE productos DROP COLUMN clasificacion;

CREATE INDEX productos_categoria_idx ON productos (categoria_id);
