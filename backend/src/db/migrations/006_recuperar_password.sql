CREATE TABLE tokens_recuperacion (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  vence_en    TIMESTAMPTZ NOT NULL,
  usado_en    TIMESTAMPTZ,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX tokens_recuperacion_hash_unico ON tokens_recuperacion (token_hash);
CREATE INDEX tokens_recuperacion_usuario ON tokens_recuperacion (usuario_id);
