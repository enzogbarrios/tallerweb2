ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS estado_pago TEXT NOT NULL DEFAULT 'aprobado'
    CHECK (estado_pago IN ('pendiente', 'aprobado', 'rechazado')),
  ADD COLUMN IF NOT EXISTS metodo_pago TEXT NOT NULL DEFAULT 'tarjeta',
  ADD COLUMN IF NOT EXISTS referencia_pago TEXT,
  ADD COLUMN IF NOT EXISTS tarjeta_ultimos4 TEXT,
  ADD COLUMN IF NOT EXISTS pagado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_estado_check
  CHECK (estado IN ('Confirmado', 'En preparación', 'Enviado', 'Entregado', 'Cancelado'));

CREATE INDEX IF NOT EXISTS pedidos_usuario_creado_idx
  ON pedidos (usuario_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS pedido_items_pedido_idx
  ON pedido_items (pedido_id);
