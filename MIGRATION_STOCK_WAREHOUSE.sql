-- ============================================================
-- MIGRATION: Agregar warehouse_id a stock_items
-- Corre esto en Supabase → SQL Editor → Run
-- ============================================================

ALTER TABLE public.stock_items
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stock_items_warehouse ON public.stock_items(warehouse_id);

-- RLS: policy para que corp pueda ver por warehouse
-- (las políticas existentes ya cubren SELECT, solo agregamos el campo)

-- Listo ✅
-- stock_items ahora tiene: warehouse_id (FK a warehouses, opcional)
-- Permite saber en qué almacén físico está cada equipo
