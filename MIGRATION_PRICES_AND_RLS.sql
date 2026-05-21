-- ============================================================
-- MIGRATION: Precios en stock + RLS completo
-- Corre esto en Supabase → SQL Editor → Run
-- ============================================================

-- 1. Agregar columnas de precio a stock_items (si no existen)
ALTER TABLE stock_items
  ADD COLUMN IF NOT EXISTS purchase_price  NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reseller_price  NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sale_price      NUMERIC DEFAULT NULL;

-- 2. RLS: products — INSERT, UPDATE, DELETE para usuarios autenticados
DO $$ BEGIN
  CREATE POLICY "auth_insert_products"
    ON products FOR INSERT TO authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_update_products"
    ON products FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_delete_products"
    ON products FOR DELETE TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth_select_products"
    ON products FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. RLS: stock_items — INSERT para usuarios corp
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

-- 4. RLS: warehouses — UPDATE para usuarios corp
DROP POLICY IF EXISTS "Corp users can update warehouses" ON warehouses;
CREATE POLICY "Corp users can update warehouses"
ON warehouses FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('corp', 'admin_corp', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('corp', 'admin_corp', 'superadmin')
  )
);

-- Listo ✅
-- stock_items ya tiene: purchase_price, reseller_price, sale_price
-- products puede ser insertado/editado por usuarios autenticados
-- warehouses puede ser editado por corp/admin_corp/superadmin
-- stock_items puede ser insertado por corp/admin_corp/superadmin
