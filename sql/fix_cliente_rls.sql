-- =====================================================
-- FIX: RLS para que clientes vean sus propios pedidos
-- Correr en: Supabase → SQL Editor → New Query
-- =====================================================

-- 1. Permitir que un cliente vea sus propios pedidos de online_orders
--    (por customer_id o por contact_email)
DROP POLICY IF EXISTS "cliente_ver_sus_pedidos" ON online_orders;
CREATE POLICY "cliente_ver_sus_pedidos" ON online_orders
  FOR SELECT
  USING (
    -- El pedido pertenece al usuario autenticado (como cliente)
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
    OR
    -- O el email del pedido coincide con el email del usuario
    contact_email = auth.email()
    OR
    -- O es staff de la misma tienda
    org_id IN (
      SELECT org_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- 2. Permitir que un cliente vea su propio registro en customers
DROP POLICY IF EXISTS "cliente_ver_su_perfil" ON customers;
CREATE POLICY "cliente_ver_su_perfil" ON customers
  FOR SELECT
  USING (
    auth_user_id = auth.uid()
    OR email = auth.email()
    OR org_id IN (
      SELECT org_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- 3. Permitir que un cliente actualice su propio perfil
DROP POLICY IF EXISTS "cliente_actualizar_su_perfil" ON customers;
CREATE POLICY "cliente_actualizar_su_perfil" ON customers
  FOR UPDATE
  USING (auth_user_id = auth.uid() OR email = auth.email())
  WITH CHECK (auth_user_id = auth.uid() OR email = auth.email());

-- 4. Permitir que un cliente inserte su propio registro (registro nuevo)
DROP POLICY IF EXISTS "cliente_insertar_su_perfil" ON customers;
CREATE POLICY "cliente_insertar_su_perfil" ON customers
  FOR INSERT
  WITH CHECK (auth_user_id = auth.uid() OR email = auth.email());

-- 5. Verificar que user_roles permite lectura al propio usuario
DROP POLICY IF EXISTS "user_ver_su_propio_rol" ON user_roles;
CREATE POLICY "user_ver_su_propio_rol" ON user_roles
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR org_id IN (
      SELECT org_id FROM user_roles ur2 WHERE ur2.user_id = auth.uid()
        AND ur2.role IN ('store_admin','corp','admin_corp','superadmin')
    )
  );

SELECT 'RLS cliente corregido ✅' AS resultado;
