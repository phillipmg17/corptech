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
  fecha           DATE        GENERATED ALWAYS AS (timestamp::date) STORED,

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
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha      ON asistencia_registros(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencia_timestamp  ON asistencia_registros(timestamp DESC);

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

-- 5. FUNCIÓN: Obtener sesiones del día (pares entrada/salida)
CREATE OR REPLACE FUNCTION get_sesiones_asistencia(
  p_org_id  UUID,
  p_fecha   DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  user_id         UUID,
  nombre          TEXT,
  email           TEXT,
  rol             TEXT,
  entrada_ts      TIMESTAMPTZ,
  salida_ts       TIMESTAMPTZ,
  entrada_lat     DOUBLE PRECISION,
  entrada_lng     DOUBLE PRECISION,
  salida_lat      DOUBLE PRECISION,
  salida_lng      DOUBLE PRECISION,
  horas_trabajadas NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH entradas AS (
    SELECT DISTINCT ON (r.user_id)
      r.user_id, r.timestamp, r.lat, r.lng
    FROM asistencia_registros r
    WHERE r.org_id = p_org_id AND r.fecha = p_fecha AND r.tipo = 'entrada'
    ORDER BY r.user_id, r.timestamp ASC
  ),
  salidas AS (
    SELECT DISTINCT ON (r.user_id)
      r.user_id, r.timestamp, r.lat, r.lng
    FROM asistencia_registros r
    WHERE r.org_id = p_org_id AND r.fecha = p_fecha AND r.tipo = 'salida'
    ORDER BY r.user_id, r.timestamp DESC
  )
  SELECT
    e.user_id,
    COALESCE(p.full_name, u.email) AS nombre,
    u.email,
    ur.role AS rol,
    e.timestamp  AS entrada_ts,
    s.timestamp  AS salida_ts,
    e.lat        AS entrada_lat,
    e.lng        AS entrada_lng,
    s.lat        AS salida_lat,
    s.lng        AS salida_lng,
    CASE WHEN s.timestamp IS NOT NULL
      THEN ROUND(EXTRACT(EPOCH FROM (s.timestamp - e.timestamp)) / 3600.0, 2)
      ELSE NULL
    END AS horas_trabajadas
  FROM entradas e
  LEFT JOIN salidas     s  ON s.user_id  = e.user_id
  LEFT JOIN auth.users  u  ON u.id       = e.user_id
  LEFT JOIN profiles    p  ON p.user_id  = e.user_id
  LEFT JOIN user_roles  ur ON ur.user_id = e.user_id AND ur.org_id = p_org_id
  ORDER BY e.timestamp ASC;
$$;

-- 6. GRANT DE PERMISOS
GRANT SELECT, INSERT ON asistencia_registros TO authenticated;
GRANT EXECUTE ON FUNCTION get_sesiones_asistencia(UUID, DATE) TO authenticated;
