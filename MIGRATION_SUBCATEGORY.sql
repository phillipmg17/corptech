-- ============================================================
-- MIGRATION: Subcategorías + Limpiar productos y stock
-- Corre esto en Supabase SQL Editor
-- ============================================================

-- 1. BORRAR TODO EL STOCK Y PRODUCTOS (en orden por FK)
DELETE FROM stock_transfer_items;
DELETE FROM stock_transfers;
DELETE FROM stock_items;
DELETE FROM prices;
DELETE FROM product_visibility;
DELETE FROM products;

-- 2. AGREGAR COLUMNA subcategory a products
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- 3. INSERTAR PRODUCTOS EJEMPLO: iPhone 17
INSERT INTO products (corp_id, name, brand, model, category, subcategory, emoji, description, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'iPhone 17',         'Apple', 'iPhone 17',         'iphone', '17', '📱', 'iPhone 17 estándar — pantalla 6.1", chip A19',                true),
  ('00000000-0000-0000-0000-000000000001', 'iPhone 17 Pro',     'Apple', 'iPhone 17 Pro',     'iphone', '17', '📱', 'iPhone 17 Pro — titanio, cámara Pro, chip A19 Pro',           true),
  ('00000000-0000-0000-0000-000000000001', 'iPhone 17 Pro Max', 'Apple', 'iPhone 17 Pro Max', 'iphone', '17', '📱', 'iPhone 17 Pro Max — pantalla 6.9", batería premium, A19 Pro', true);

-- Listo ✅ Ahora el panel mostrará la estructura:
-- Categoría: iPhone  →  Subcategoría: 17  →  Items: normal, Pro, Pro Max
