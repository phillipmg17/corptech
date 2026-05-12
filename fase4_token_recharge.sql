-- ============================================================
--  FASE 4 — Sistema de Recarga de Tokens IMEI
--  Corre esto en Supabase SQL Editor
-- ============================================================

-- 1. Tabla de solicitudes de recarga
CREATE TABLE IF NOT EXISTS token_recharge_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  amount_soles      NUMERIC(10,2) NOT NULL DEFAULT 0,
  tokens_requested  INTEGER NOT NULL DEFAULT 0,
  payment_method    TEXT NOT NULL DEFAULT 'yape',   -- yape | transferencia | efectivo
  screenshot_url    TEXT,
  notes             TEXT,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  tokens_granted    INTEGER,
  api_setting_id    UUID REFERENCES api_settings(id), -- proveedor a recargar
  approved_by       UUID REFERENCES users(id),
  approved_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bucket de screenshots (ejecutar en Supabase Storage si no existe)
-- Ve a Supabase > Storage > New Bucket
-- Nombre: recharge-screenshots  |  Public: YES
-- O copia este snippet en SQL Editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('recharge-screenshots', 'recharge-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Política: cualquier usuario autenticado puede subir al bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated upload recharge' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "authenticated upload recharge"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'recharge-screenshots');
  END IF;
END $$;

-- 4. Política: todos pueden ver las imágenes (bucket público)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'public read recharge' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "public read recharge"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'recharge-screenshots');
  END IF;
END $$;

-- Listo. Ahora la tabla token_recharge_requests existe y el bucket está listo.
