-- ══════════════════════════════════════════════════════════════
--  MIGRATION: Fotos por color en productos modelo
--  Copia y ejecuta en Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- 1. Agregar columna color_images al catálogo de productos
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS color_images jsonb DEFAULT '{}';

-- 2. Crear bucket de almacenamiento para imágenes de productos
-- (Ejecutar esto también en SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Política: cualquiera puede ver las imágenes (e-commerce público)
DO $$ BEGIN
  CREATE POLICY "public_read_product_images"
    ON storage.objects FOR SELECT TO anon, authenticated
    USING (bucket_id = 'product-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Política: solo usuarios autenticados pueden subir imágenes
DO $$ BEGIN
  CREATE POLICY "auth_upload_product_images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'product-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Política: usuarios autenticados pueden actualizar imágenes
DO $$ BEGIN
  CREATE POLICY "auth_update_product_images"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'product-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
