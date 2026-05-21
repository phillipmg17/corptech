-- ============================================================
-- MIGRATION: Columnas faltantes en stock_items
-- Corre esto en Supabase → SQL Editor → Run
-- ============================================================

ALTER TABLE public.stock_items
  ADD COLUMN IF NOT EXISTS color_info     TEXT,
  ADD COLUMN IF NOT EXISTS storage_info   TEXT,
  ADD COLUMN IF NOT EXISTS model_number   TEXT,
  ADD COLUMN IF NOT EXISTS imei2          TEXT,
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reseller_price NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sale_price     NUMERIC DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_items_imei2        ON public.stock_items(imei2);
CREATE INDEX IF NOT EXISTS idx_stock_items_color        ON public.stock_items(color_info);
CREATE INDEX IF NOT EXISTS idx_stock_items_storage      ON public.stock_items(storage_info);

-- Listo ✅
-- stock_items ahora tiene: imei, imei2, serial_number, color_info,
-- storage_info, model_number, purchase_price, reseller_price, sale_price
