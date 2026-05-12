-- ============================================================
--  Enlace IMEI Check → Stock Item
--  Corre esto en Supabase SQL Editor
-- ============================================================

-- Agregar referencia al check en cada item de stock
ALTER TABLE stock_items
  ADD COLUMN IF NOT EXISTS imei_check_id UUID REFERENCES imei_checks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS model_number   TEXT,   -- "A3526"
  ADD COLUMN IF NOT EXISTS color_info     TEXT,   -- "Natural Titanium"
  ADD COLUMN IF NOT EXISTS storage_info   TEXT;   -- "256GB"
