-- ============================================================
-- FIX: Políticas RLS que fallan con usuario multi-rol
-- Problema: (SELECT role FROM user_roles WHERE user_id = auth.uid())
--   devuelve múltiples filas si el usuario tiene más de un rol →
--   PostgreSQL lanza "more than one row returned by a subquery"
-- Solución: reemplazar con EXISTS (...)
-- Corre esto en Supabase → SQL Editor → Run
-- ============================================================

-- ── 1. import_batches ──
DROP POLICY IF EXISTS import_batches_policy ON import_batches;
CREATE POLICY import_batches_policy ON import_batches
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
  );

-- ── 2. cash_accounts ──
DROP POLICY IF EXISTS cash_accounts_policy ON cash_accounts;
CREATE POLICY cash_accounts_policy ON cash_accounts
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.org_id = cash_accounts.org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.org_id = cash_accounts.org_id
    )
  );

-- ── 3. liquidaciones ──
DROP POLICY IF EXISTS liquidaciones_policy ON liquidaciones;
CREATE POLICY liquidaciones_policy ON liquidaciones
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.org_id = liquidaciones.store_org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.org_id = liquidaciones.store_org_id
    )
  );

-- ── 4. plataformas_venta ──
DROP POLICY IF EXISTS plataformas_venta_write ON plataformas_venta;
CREATE POLICY plataformas_venta_write ON plataformas_venta
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
  );

-- ── 5. tienda_plataformas ──
DROP POLICY IF EXISTS tienda_plataformas_policy ON tienda_plataformas;
CREATE POLICY tienda_plataformas_policy ON tienda_plataformas
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.org_id = tienda_plataformas.org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.org_id = tienda_plataformas.org_id
    )
  );

-- ── 6. liquidaciones_plataforma ──
DROP POLICY IF EXISTS liq_plat_policy ON liquidaciones_plataforma;
CREATE POLICY liq_plat_policy ON liquidaciones_plataforma
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.org_id = liquidaciones_plataforma.store_org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.org_id = liquidaciones_plataforma.store_org_id
    )
  );

-- ── 7. calendario_liquidaciones ──
DROP POLICY IF EXISTS calendario_policy ON calendario_liquidaciones;
CREATE POLICY calendario_policy ON calendario_liquidaciones
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.org_id = calendario_liquidaciones.store_org_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('superadmin','corp','admin_corp')
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.org_id = calendario_liquidaciones.store_org_id
    )
  );

-- ✅ Listo — todas las políticas corregidas
