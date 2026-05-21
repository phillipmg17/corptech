-- ============================================================
-- MIGRATION: Agregar invoice_items a import_batches
-- Corre esto en Supabase → SQL Editor → Run
-- ============================================================

ALTER TABLE public.import_batches
  ADD COLUMN IF NOT EXISTS invoice_items JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fecha_llegada_real DATE DEFAULT NULL;

-- invoice_items guarda el array de líneas del PDF/Excel leído
-- Formato: [{ descripcion, cantidad, partNumber, precioUnit, precioTotal }]

-- Listo ✅
