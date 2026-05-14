-- =====================================================
-- SMART POS MIGRATION
-- Correr en: Supabase → SQL Editor → New Query
-- =====================================================

-- 1. NUEVA TABLA: discount_requests
--    Solicitudes de descuento que requieren aprobación del admin
CREATE TABLE IF NOT EXISTS discount_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cashier_id    UUID NOT NULL REFERENCES auth.users(id),
  sale_amount   NUMERIC(12,2) NOT NULL,
  discount_pct  INT NOT NULL,
  notes         TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','denied')),
  reviewed_by   UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE discount_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discount_requests_access" ON discount_requests
  FOR ALL USING (
    cashier_id = auth.uid()
    OR org_id IN (
      SELECT org_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('store_admin','corp','admin_corp','superadmin')
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_discount_requests_updated ON discount_requests;
CREATE TRIGGER trg_discount_requests_updated
  BEFORE UPDATE ON discount_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Habilitar Realtime (necesario para la aprobación en vivo)
ALTER PUBLICATION supabase_realtime ADD TABLE discount_requests;


-- 2. COLUMNAS NUEVAS EN TABLA: sales
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS discount_pct    INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_req_id UUID REFERENCES discount_requests(id);


-- 3. COLUMNA NUEVA EN TABLA: sale_items
--    Guarda el IMEI vendido para trazabilidad
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS imei TEXT;


-- 4. VERIFICAR QUE stock_items.status acepta 'reserved'
--    (si ves error de tipo ENUM, corre esto también)
-- ALTER TYPE stock_status ADD VALUE IF NOT EXISTS 'reserved';
-- (solo si status es un ENUM — si es TEXT no necesitas esto)

SELECT 'Migración Smart POS aplicada ✅' AS resultado;
