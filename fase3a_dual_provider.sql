-- ============================================================
--  DUAL PROVIDER — Sickw + IMEICheck.com
--  Corre esto en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columna 'provider' (sickw | imeicheck)
ALTER TABLE api_settings
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'sickw';

-- 2. Marcar todos los registros existentes como 'sickw'
UPDATE api_settings SET provider = 'sickw' WHERE provider IS NULL OR provider = '';

-- 3. Quitar la restricción unique antigua (org_id, service)
ALTER TABLE api_settings
  DROP CONSTRAINT IF EXISTS api_settings_org_id_service_key;

-- 4. Nueva restricción que permite 1 registro por (org, tipo, proveedor)
ALTER TABLE api_settings
  ADD CONSTRAINT api_settings_org_id_service_provider_key
  UNIQUE(org_id, service, provider);

-- Listo — ahora cada org puede tener Sickw Y IMEICheck al mismo tiempo
