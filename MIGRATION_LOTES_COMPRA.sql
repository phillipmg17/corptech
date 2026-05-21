-- ============================================================
-- MIGRATION: Lotes de Compra
-- Corre esto en Supabase → SQL Editor → Run
-- ============================================================

-- 1. Tabla lotes_compra
CREATE TABLE IF NOT EXISTS public.purchase_lots (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corp_id          UUID NOT NULL REFERENCES public.organizations(id),
  numero_lote      TEXT NOT NULL,            -- Ej: "LOTE-2025-001"
  proveedor        TEXT,                      -- Nombre del proveedor
  numero_factura   TEXT,                      -- Número de factura
  fecha_compra     DATE DEFAULT CURRENT_DATE,
  total_unidades   INTEGER DEFAULT 0,
  costo_total      NUMERIC DEFAULT 0,        -- Suma purchase_price de todos los items
  notas            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_purchase_lots_corp    ON public.purchase_lots(corp_id);
CREATE INDEX IF NOT EXISTS idx_purchase_lots_numero  ON public.purchase_lots(numero_lote);
CREATE INDEX IF NOT EXISTS idx_purchase_lots_factura ON public.purchase_lots(numero_factura);

-- 2. Agregar lot_id a stock_items
ALTER TABLE public.stock_items
  ADD COLUMN IF NOT EXISTS lot_id UUID REFERENCES public.purchase_lots(id);

CREATE INDEX IF NOT EXISTS idx_stock_items_lot ON public.stock_items(lot_id);

-- 3. RLS para purchase_lots
ALTER TABLE public.purchase_lots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "corp_all_purchase_lots"
    ON public.purchase_lots FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Asegurarse de que stock_items tiene RLS INSERT (por si no se corrió antes)
DROP POLICY IF EXISTS "Corp users can insert stock_items" ON stock_items;
CREATE POLICY "Corp users can insert stock_items"
ON stock_items FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('corp', 'admin_corp', 'superadmin')
  )
);

-- 5. RLS stock_items UPDATE (para poder actualizar lot_id)
DO $$ BEGIN
  CREATE POLICY "corp_update_stock_items"
    ON public.stock_items FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Listo ✅
-- Tabla purchase_lots creada con: numero_lote, proveedor, numero_factura, fecha_compra
-- stock_items tiene columna lot_id que apunta al lote
