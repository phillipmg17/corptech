-- ============================================================
-- MÓDULO DE ASISTENCIA CON GEOLOCALIZACIÓN
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. TABLA PRINCIPAL DE REGISTROS DE ASISTENCIA
CREATE TABLE IF NOT EXISTS asistencia_registros (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Tipo de marcado
  tipo            TEXT        NOT NULL CHECK (tipo IN ('entrada', 'salida')),

  -- Timestamp del servidor (no del cliente)
  timestamp       TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Geolocalización
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  precision_gps   REAL,       -- precisión en metros
  direccion       TEXT,       -- dirección reversa opcional

  -- Metadata
  dispositivo     TEXT,       -- "iPhone / iOS 17", "Android 14", etc.
  ip              TEXT,
  notas           TEXT,

  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_asistencia_user_id    ON asistencia_registros(user_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_org_id     ON asistencia_registros(org_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_timestamp  ON asistencia_registros(timestamp DESC);
-- Índice por timestamp para filtrar por rango de fechas
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha
  ON asistencia_registros(timestamp);

-- 3. HABILITAR RLS
ALTER TABLE asistencia_registros ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS

-- Trabajador: solo ve y crea sus propios registros
CREATE POLICY "trabajador_ver_propios" ON asistencia_registros
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "trabajador_crear_propio" ON asistencia_registros
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin de tienda: ve todos los de su org
CREATE POLICY "store_admin_ver_org" ON asistencia_registros
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('store_admin','gerente','store_manager','admin_corp','corp','superadmin')
    )
  );

-- Admin Corp / SuperAdmin: puede editar y borrar
CREATE POLICY "corp_admin_gestionar" ON asistencia_registros
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin_corp','corp','superadmin')
    )
  );

-- 5. GRANT DE PERMISOS
GRANT SELECT, INSERT ON asistencia_registros TO authenticated;
