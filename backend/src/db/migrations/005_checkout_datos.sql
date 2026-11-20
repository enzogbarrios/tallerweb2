ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS comprador_nombre TEXT,
  ADD COLUMN IF NOT EXISTS comprador_apellido TEXT,
  ADD COLUMN IF NOT EXISTS comprador_email TEXT,
  ADD COLUMN IF NOT EXISTS comprador_telefono TEXT,
  ADD COLUMN IF NOT EXISTS comprador_dni TEXT,
  ADD COLUMN IF NOT EXISTS envio_calle TEXT,
  ADD COLUMN IF NOT EXISTS envio_numero TEXT,
  ADD COLUMN IF NOT EXISTS envio_piso_depto TEXT,
  ADD COLUMN IF NOT EXISTS envio_ciudad TEXT,
  ADD COLUMN IF NOT EXISTS envio_provincia TEXT,
  ADD COLUMN IF NOT EXISTS envio_codigo_postal TEXT,
  ADD COLUMN IF NOT EXISTS envio_indicaciones TEXT,
  ADD COLUMN IF NOT EXISTS tarjeta_marca TEXT;
