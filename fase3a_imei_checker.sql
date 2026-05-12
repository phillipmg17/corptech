-- ============================================================
--  FASE 3A — IMEI Checker via Sickw API
--  Corre esto en Supabase SQL Editor
-- ============================================================

-- 1. Tabla de credenciales API por org (solo superadmin escribe)
CREATE TABLE IF NOT EXISTS api_settings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID REFERENCES organizations(id) ON DELETE CASCADE,
  service        TEXT NOT NULL,          -- 'sickw'
  api_key        TEXT,
  credits_limit  INTEGER DEFAULT 100,
  credits_used   INTEGER DEFAULT 0,
  is_active      BOOLEAN DEFAULT true,
  notas          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, service)
);

-- RLS api_settings
ALTER TABLE api_settings ENABLE ROW LEVEL SECURITY;

-- Corp y superadmin pueden LEER sus propias settings
CREATE POLICY "api_settings_read" ON api_settings
  FOR SELECT USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin')
  );

-- Solo superadmin puede escribir
CREATE POLICY "api_settings_write" ON api_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin')
  );

-- 2. Historial de consultas IMEI
CREATE TABLE IF NOT EXISTS imei_checks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID REFERENCES organizations(id),
  checked_by   UUID REFERENCES auth.users(id),
  imei         TEXT NOT NULL,
  service_id   TEXT,
  service_name TEXT,
  result       JSONB,
  raw_response TEXT,
  status       TEXT DEFAULT 'pending',   -- pending | success | error
  error_msg    TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- RLS imei_checks
ALTER TABLE imei_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "imei_checks_own_org" ON imei_checks
  FOR ALL USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin')
  );

-- 3. Feature registry
INSERT INTO feature_registry (code, name, description, panel, status, version)
VALUES
  ('IMEI_CHECKER', 'IMEI Checker Sickw', 'Verificación de IMEI via Sickw — créditos habilitados por SuperAdmin', 'corp', 'done', '1.0'),
  ('API_SETTINGS',  'API Settings por Org', 'SuperAdmin asigna claves API (Sickw, etc.) a cada organización',            'super', 'done', '1.0')
ON CONFLICT (code) DO NOTHING;
