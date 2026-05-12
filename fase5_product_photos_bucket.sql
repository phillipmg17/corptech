-- ============================================================
--  FASE 5 — Bucket de Fotos de Productos
--  Corre esto en Supabase SQL Editor
-- ============================================================

-- 1. Crear el bucket product-photos (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Política: usuarios autenticados pueden subir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'authenticated upload product-photos'
    AND tablename = 'objects'
  ) THEN
    CREATE POLICY "authenticated upload product-photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'product-photos');
  END IF;
END $$;

-- 3. Política: lectura pública (imágenes visibles en la tienda)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'public read product-photos'
    AND tablename = 'objects'
  ) THEN
    CREATE POLICY "public read product-photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-photos');
  END IF;
END $$;

-- 4. Política: el dueño puede borrar sus fotos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'owner delete product-photos'
    AND tablename = 'objects'
  ) THEN
    CREATE POLICY "owner delete product-photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'product-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- Listo. El bucket product-photos está creado y configurado.
