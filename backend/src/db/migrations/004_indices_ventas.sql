CREATE INDEX IF NOT EXISTS pedidos_creado_idx
  ON pedidos (creado_en DESC, id DESC);

CREATE INDEX IF NOT EXISTS pedidos_estado_creado_idx
  ON pedidos (estado, creado_en DESC);
