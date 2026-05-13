-- ══════════════════════════════════════════════════════════════
--  FIX RLS: tabla products
--  Copia este SQL en Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- 1. Lectura para anon (e-commerce público)
DO $$ BEGIN
  CREATE POLICY "anon_select_products"
    ON products FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Lectura para usuarios logueados
DO $$ BEGIN
  CREATE POLICY "auth_select_products"
    ON products FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Insertar productos (admin corp)
DO $$ BEGIN
  CREATE POLICY "auth_insert_products"
    ON products FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Editar productos
DO $$ BEGIN
  CREATE POLICY "auth_update_products"
    ON products FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Eliminar productos
DO $$ BEGIN
  CREATE POLICY "auth_delete_products"
    ON products FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
