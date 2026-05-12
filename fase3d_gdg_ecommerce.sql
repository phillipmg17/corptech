-- ============================================================
--  FASE 3D — GDG-Style E-commerce
--  Nuevas columnas en tiendas_config
--  Corre esto en Supabase SQL Editor
-- ============================================================

ALTER TABLE tiendas_config
  ADD COLUMN IF NOT EXISTS gallery_urls         JSONB       DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS facebook             TEXT,
  ADD COLUMN IF NOT EXISTS youtube              TEXT,
  ADD COLUMN IF NOT EXISTS reviews_data         JSONB       DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS google_rating        DECIMAL(3,1) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER     DEFAULT 0;

-- Feature registry
INSERT INTO feature_registry (code, name, description, panel, status, version)
VALUES
  ('ECOM_GDG_STYLE',  'E-commerce GDG Style',      'Hero slideshow, reviews cards, mapa, Instagram, TikTok, footer multi-col', 'store', 'done', '2.0'),
  ('STORE_GALLERY',   'Galería hero (slideshow)',   'Múltiples fotos para slider del hero en tienda pública',                   'store', 'done', '1.0'),
  ('STORE_REVIEWS',   'Reseñas Google manuales',    'Carga de reseñas de Google en config para mostrar en tienda',             'store', 'done', '1.0')
ON CONFLICT (code) DO NOTHING;
