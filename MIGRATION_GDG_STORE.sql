-- ============================================================
-- MIGRATION: GDG Store — 4ta empresa del holding
-- Corre esto en Supabase → SQL Editor → Run
-- ✅ NO toca nada de las otras 3 tiendas ni de CorpTech
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. REGISTRAR GDG STORE COMO ORG #5
-- ─────────────────────────────────────────────
INSERT INTO organizations (id, name, slug, type)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  'GDG Store',
  'gdg',
  'store'
)
ON CONFLICT (id) DO UPDATE SET
  name = 'GDG Store',
  slug = 'gdg';

-- ─────────────────────────────────────────────
-- 2. COLUMNA split_tipo EN stock_items
--    Identifica a quién corresponde la ganancia de cada equipo
--    'gdg_propio' → GDG compró solo → 100% GDG
--    'conjunto'   → GDG + Corp juntos → 33% GDG / 67% Corp
--    'corp'       → Corp compró solo → 10% GDG comisión / 90% Corp
-- ─────────────────────────────────────────────
ALTER TABLE public.stock_items
  ADD COLUMN IF NOT EXISTS split_tipo TEXT DEFAULT NULL
  CHECK (split_tipo IN ('gdg_propio','conjunto','corp') OR split_tipo IS NULL);

CREATE INDEX IF NOT EXISTS idx_stock_items_split_tipo ON public.stock_items(split_tipo);

-- ─────────────────────────────────────────────
-- 3. COLUMNAS GDG EN import_batches
--    Para registrar cuando GDG participa en un lote de importación
-- ─────────────────────────────────────────────
ALTER TABLE public.import_batches
  ADD COLUMN IF NOT EXISTS gdg_participa    BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gdg_aporte_usd   DECIMAL(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gdg_split_pct    DECIMAL(5,2)  DEFAULT 33;
-- gdg_split_pct: por defecto 33% pero puede ajustarse por lote

-- ─────────────────────────────────────────────
-- 4. TABLA gdg_creditos
--    Acumula el saldo que CorpTech le debe a GDG por cada venta
--    Se llena automáticamente cuando se registra una venta
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gdg_creditos (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id         UUID          REFERENCES sales(id) ON DELETE SET NULL,
  stock_item_id   UUID          REFERENCES stock_items(id) ON DELETE SET NULL,
  split_tipo      TEXT          NOT NULL CHECK (split_tipo IN ('gdg_propio','conjunto','corp')),
  precio_venta    DECIMAL(14,2) NOT NULL DEFAULT 0,
  costo_landed    DECIMAL(14,2) DEFAULT 0,
  ganancia_neta   DECIMAL(14,2) DEFAULT 0,  -- precio_venta - costo_landed
  gdg_pct         DECIMAL(5,2)  NOT NULL DEFAULT 33, -- 100, 33 o 10
  gdg_monto       DECIMAL(14,2) NOT NULL DEFAULT 0,  -- lo que le toca a GDG
  corp_monto      DECIMAL(14,2) NOT NULL DEFAULT 0,  -- lo que le toca a Corp
  moneda          TEXT          DEFAULT 'PEN',
  estado          TEXT          DEFAULT 'pendiente'
                                CHECK (estado IN ('pendiente','liquidado')),
  liquidacion_id  UUID          DEFAULT NULL, -- se llena cuando se paga
  notas           TEXT,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE public.gdg_creditos ENABLE ROW LEVEL SECURITY;

-- Corp y GDG pueden ver los créditos
CREATE POLICY gdg_creditos_policy ON public.gdg_creditos
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp','admin_gdg','gdg')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
  );

CREATE INDEX IF NOT EXISTS idx_gdg_creditos_sale ON public.gdg_creditos(sale_id);
CREATE INDEX IF NOT EXISTS idx_gdg_creditos_estado ON public.gdg_creditos(estado);
CREATE INDEX IF NOT EXISTS idx_gdg_creditos_liq ON public.gdg_creditos(liquidacion_id);

-- ─────────────────────────────────────────────
-- 5. TABLA gdg_liquidaciones
--    GDG solicita el pago de su saldo acumulado
--    Corp aprueba y marca como pagada
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gdg_liquidaciones (
  id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  estado            TEXT          DEFAULT 'solicitada'
                                  CHECK (estado IN ('solicitada','aprobada','pagada','rechazada')),
  monto_total_pen   DECIMAL(14,2) DEFAULT 0,   -- total que se liquida
  num_ventas        INTEGER       DEFAULT 0,    -- cuántas ventas incluye
  periodo_desde     DATE,                       -- rango de fechas incluido
  periodo_hasta     DATE,
  metodo_pago       TEXT,                       -- transferencia, efectivo, etc.
  comprobante_url   TEXT,                       -- foto del pago
  notas_gdg         TEXT,                       -- notas de GDG al solicitar
  notas_corp        TEXT,                       -- notas de Corp al aprobar/rechazar
  solicitado_por    UUID          REFERENCES users(id),
  aprobado_por      UUID          REFERENCES users(id),
  aprobado_at       TIMESTAMPTZ,
  pagado_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE public.gdg_liquidaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY gdg_liq_policy ON public.gdg_liquidaciones
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp','admin_gdg','gdg')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp','admin_gdg','gdg')
    )
  );

CREATE INDEX IF NOT EXISTS idx_gdg_liq_estado ON public.gdg_liquidaciones(estado);

-- ─────────────────────────────────────────────
-- 6. AGREGAR ROLES GDG AL SISTEMA
--    (para que los usuarios de GDG puedan acceder a su panel)
-- ─────────────────────────────────────────────
-- Los roles válidos que puede tener un usuario de GDG:
-- 'admin_gdg' → admin de GDG Store (ve todo de GDG + puede solicitar liquidación)
-- 'gdg'       → vendedor de GDG (acceso a POS y catálogo GDG)
-- Nota: estos roles ya deben existir en tu tabla user_roles si no los restringes
-- Si tienes un CHECK constraint en la columna role, agrega estos valores:
-- ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
-- ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
--   CHECK (role IN ('superadmin','corp','admin_corp','admin','gerente','vendedor','admin_gdg','gdg'));

-- ─────────────────────────────────────────────
-- 7. VIEW: saldo_gdg
--    Vista rápida del total que Corp le debe a GDG
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW public.saldo_gdg AS
SELECT
  COALESCE(SUM(gdg_monto), 0)            AS saldo_pendiente_pen,
  COUNT(*)                                AS ventas_pendientes,
  MIN(created_at)                         AS desde,
  MAX(created_at)                         AS hasta,
  SUM(CASE WHEN split_tipo = 'gdg_propio' THEN gdg_monto ELSE 0 END) AS monto_propio,
  SUM(CASE WHEN split_tipo = 'conjunto'   THEN gdg_monto ELSE 0 END) AS monto_conjunto,
  SUM(CASE WHEN split_tipo = 'corp'       THEN gdg_monto ELSE 0 END) AS monto_comision
FROM public.gdg_creditos
WHERE estado = 'pendiente';

-- ─────────────────────────────────────────────
-- 8. FEATURE REGISTRY
-- ─────────────────────────────────────────────
INSERT INTO feature_registry (code, name, description, panel, status, version)
VALUES
  ('GDG_STORE',       'GDG Store — 4ta empresa',        'Integración GDG Store con split de ganancia 33/10/100%', 'corp',  'done', '1.0'),
  ('GDG_CREDITOS',    'Créditos GDG por ventas',         'Acumulación automática del saldo GDG por cada venta',    'corp',  'done', '1.0'),
  ('GDG_LIQUIDACION', 'Liquidación GDG → CorpTech',      'GDG solicita pago, Corp aprueba y registra',             'corp',  'done', '1.0'),
  ('GDG_SPLIT',       'Split inteligente de ganancia',   'Regla 100/33/10% según tipo de compra del equipo',      'corp',  'done', '1.0')
ON CONFLICT (code) DO NOTHING;

-- ✅ Listo
-- Siguiente paso: correr MIGRATION_GDG_IMPORT_STOCK.sql para subir el stock actual de GDG desde Excel
