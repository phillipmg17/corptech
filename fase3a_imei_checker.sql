-- ============================================================
--  FASE 3A — IMEI Checker (genérico: Sickw, CheckIMEI, etc.)
--  Corre esto en Supabase SQL Editor
-- ============================================================

-- 1. Tabla de configuración API por org (solo superadmin escribe)
CREATE TABLE IF NOT EXISTS api_settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider_name    TEXT NOT NULL DEFAULT 'IMEI API',  -- nombre libre: "Sickw", "CheckIMEI", etc.
  service          TEXT NOT NULL DEFAULT 'imei',      -- clave interna: 'imei'
  api_key          TEXT,
  api_endpoint     TEXT DEFAULT 'https://sickw.com/api.php',
  tokens_limit     INTEGER DEFAULT 100,
  tokens_used      INTEGER DEFAULT 0,
  allowed_services JSONB DEFAULT '[]',   -- [{id:"12",label:"Apple Info"}, ...]
  is_active        BOOLEAN DEFAULT true,
  notas            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, service)
);

-- RLS api_settings
ALTER TABLE api_settings ENABLE ROW LEVEL SECURITY;

-- Org propia puede LEER sus settings (la API route lo usa vía service_role)
CREATE POLICY "api_settings_read" ON api_settings
  FOR SELECT USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin')
  );

-- Solo superadmin escribe
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
  ('IMEI_CHECKER', 'IMEI Checker', 'Verificación IMEI via API externa — tokens habilitados por SuperAdmin', 'corp',  'done', '1.0'),
  ('API_SETTINGS',  'API Settings', 'SuperAdmin asigna API keys y servicios permitidos a cada org',           'super', 'done', '1.0')
ON CONFLICT (code) DO NOTHING;
