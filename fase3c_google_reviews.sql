-- ============================================================
--  FASE 3C — Google Reviews + Photo URL
--  Corre esto en Supabase SQL Editor
-- ============================================================

-- 1. Agregar google_place_id a tiendas_config
ALTER TABLE tiendas_config
  ADD COLUMN IF NOT EXISTS google_place_id TEXT;

-- 2. Agregar photo_url a products (para fotos de productos)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 3. Registrar en feature_registry
INSERT INTO feature_registry (code, name, description, panel, status, version)
VALUES
  ('GOOGLE_REVIEWS', 'Google Reviews en Tienda', 'Mapa embed + botones Ver/Dejar reseña en tienda pública', 'store', 'done', '1.0'),
  ('PRODUCT_PHOTOS',  'Fotos de Productos',       'Campo photo_url en products para galería en e-commerce',   'corp',  'done', '1.0')
ON CONFLICT (code) DO NOTHING;
