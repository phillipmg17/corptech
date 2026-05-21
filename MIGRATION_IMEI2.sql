-- ============================================================
-- MIGRATION: Agregar imei2 a stock_items
-- Corre esto en Supabase → SQL Editor → Run
-- ============================================================

ALTER TABLE public.stock_items
  ADD COLUMN IF NOT EXISTS imei2 TEXT;

CREATE INDEX IF NOT EXISTS idx_stock_items_imei2 ON public.stock_items(imei2);

-- Listo ✅
-- stock_items ahora tiene: imei (principal), imei2 (secundario), serial_number
