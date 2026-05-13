-- ============================================================
--  FASE 6 — Catálogo como Plantilla de Producto
--  Corre esto en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columnas de plantilla a la tabla products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category          TEXT DEFAULT 'otro',
  ADD COLUMN IF NOT EXISTS chip              TEXT,
  ADD COLUMN IF NOT EXISTS default_colors    TEXT[],
  ADD COLUMN IF NOT EXISTS default_capacities TEXT[];

-- 2. Actualizar productos existentes con categoría 'otro' por defecto
UPDATE products SET category = 'otro' WHERE category IS NULL;

-- 3. Índice para filtrar por categoría rápido
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Listo. Ahora los productos tienen: category, chip, default_colors, default_capacities
-- Categorías disponibles: iphone | ipad | mac | airpods | samsung | accesorio | otro
