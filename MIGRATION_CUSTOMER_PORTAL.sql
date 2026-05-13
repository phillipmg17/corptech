-- ══════════════════════════════════════════════════════
--  MIGRATION: Portal de Clientes
--  Copia y ejecuta en Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════

-- 1. Agregar auth_user_id a customers para vincular con Supabase Auth
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);

-- 2. Política RLS: el cliente solo ve sus propios datos
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "cliente_ve_sus_datos"
    ON customers FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "cliente_actualiza_sus_datos"
    ON customers FOR UPDATE
    TO authenticated
    USING (auth_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "cliente_inserta_sus_datos"
    ON customers FOR INSERT
    TO authenticated
    WITH CHECK (auth_user_id = auth.uid() OR auth_user_id IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. El admin/staff de la tienda sigue viendo todos los clientes de su tienda
DO $$ BEGIN
  CREATE POLICY "staff_ve_clientes_tienda"
    ON customers FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.store_id = customers.store_id
          AND ur.role IN ('gerente','vendedor','store_manager','store_admin','corp','superadmin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Corp y superadmin ven todo
DO $$ BEGIN
  CREATE POLICY "corp_ve_todos_clientes"
    ON customers FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('corp','superadmin','admin_corp')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Políticas RLS en sales para que el cliente vea sus pedidos
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "cliente_ve_sus_pedidos"
    ON sales FOR SELECT
    TO authenticated
    USING (
      customer_id IN (
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Staff ve todas las ventas de su tienda
DO $$ BEGIN
  CREATE POLICY "staff_ve_ventas_tienda"
    ON sales FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.store_id = sales.store_id
          AND ur.role IN ('gerente','vendedor','store_manager','store_admin','corp','superadmin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Sale_items: el cliente ve los items de sus pedidos
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "cliente_ve_sus_items"
    ON sale_items FOR SELECT
    TO authenticated
    USING (
      sale_id IN (
        SELECT s.id FROM sales s
        JOIN customers c ON s.customer_id = c.id
        WHERE c.auth_user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "staff_ve_items_tienda"
    ON sale_items FOR ALL
    TO authenticated
    USING (
      sale_id IN (
        SELECT s.id FROM sales s
        JOIN user_roles ur ON ur.store_id = s.store_id
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('gerente','vendedor','store_manager','store_admin','corp','superadmin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
