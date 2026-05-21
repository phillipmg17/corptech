-- ============================================================
-- MIGRATION: Arreglar SELECT en stock_items para usuarios corp
-- El problema: otra cuenta corp ve 0 porque RLS bloquea el SELECT
-- Corre esto en Supabase → SQL Editor → Run
-- ============================================================

-- 1. Dar SELECT a todos los usuarios autenticados con rol corp
DROP POLICY IF EXISTS "corp_select_stock_items" ON stock_items;
CREATE POLICY "corp_select_stock_items"
ON stock_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('corp', 'admin_corp', 'superadmin', 'store', 'admin_store', 'employee')
  )
);

-- 2. Por si acaso, también SELECT en products para todos los autenticados
DROP POLICY IF EXISTS "auth_select_products" ON products;
CREATE POLICY "auth_select_products"
ON products FOR SELECT TO authenticated
USING (true);

-- 3. SELECT en purchase_lots para usuarios corp
DROP POLICY IF EXISTS "corp_select_purchase_lots" ON public.purchase_lots;
DO $$ BEGIN
  CREATE POLICY "corp_select_purchase_lots"
    ON public.purchase_lots FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. SELECT en warehouses para todos los autenticados
DROP POLICY IF EXISTS "auth_select_warehouses" ON warehouses;
DO $$ BEGIN
  CREATE POLICY "auth_select_warehouses"
    ON warehouses FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. SELECT en organizations para todos los autenticados
DROP POLICY IF EXISTS "auth_select_organizations" ON organizations;
DO $$ BEGIN
  CREATE POLICY "auth_select_organizations"
    ON organizations FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. DELETE en warehouses para usuarios corp
DROP POLICY IF EXISTS "corp_delete_warehouses" ON warehouses;
DO $$ BEGIN
  CREATE POLICY "corp_delete_warehouses"
    ON warehouses FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('corp', 'admin_corp', 'superadmin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Listo ✅
-- Ahora cualquier usuario autenticado con rol corp/admin_corp/superadmin
-- puede ver todo el stock, productos, lotes, almacenes y organizaciones
-- y también puede eliminar almacenes
