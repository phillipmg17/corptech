-- ══════════════════════════════════════════════════════════════
--  MIGRATION: Online Orders — Pedidos del E-Commerce
--  Copia y ejecuta en Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- 1. Tabla de pedidos online (separada del POS)
CREATE TABLE IF NOT EXISTS public.online_orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id           UUID NOT NULL REFERENCES public.organizations(id),
  customer_id      UUID REFERENCES public.customers(id),

  -- Datos de contacto (para compras sin cuenta o guests)
  contact_name     TEXT,
  contact_email    TEXT,
  contact_phone    TEXT,
  delivery_address TEXT,

  -- Detalle del pedido como JSON (lista de productos)
  items            JSONB NOT NULL DEFAULT '[]',
  -- Ejemplo: [{"name":"iPhone 15 Pro","variant":"Negro 256GB","qty":1,"price":4299}]

  total_amount     NUMERIC NOT NULL DEFAULT 0,
  payment_method   TEXT,   -- 'whatsapp','izipay','niubiz','yape','plin','transferencia'

  -- Estado del pedido
  status           TEXT DEFAULT 'pendiente' CHECK (
                     status IN ('pendiente','confirmado','procesando','entregado','cancelado')
                   ),

  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_online_orders_org_id    ON public.online_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_online_orders_customer  ON public.online_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_online_orders_email     ON public.online_orders(contact_email);
CREATE INDEX IF NOT EXISTS idx_online_orders_status    ON public.online_orders(status);

-- 3. Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_online_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_online_orders_updated_at ON public.online_orders;
CREATE TRIGGER trg_online_orders_updated_at
  BEFORE UPDATE ON public.online_orders
  FOR EACH ROW EXECUTE FUNCTION update_online_orders_updated_at();

-- 4. RLS — Seguridad por tienda
ALTER TABLE public.online_orders ENABLE ROW LEVEL SECURITY;

-- El cliente ve sus propios pedidos (por customer_id o email)
DO $$ BEGIN
  CREATE POLICY "cliente_ve_sus_online_orders"
    ON public.online_orders FOR SELECT TO authenticated
    USING (
      customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
      OR contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Staff de la tienda ve todos los pedidos de su org
DO $$ BEGIN
  CREATE POLICY "staff_ve_online_orders_tienda"
    ON public.online_orders FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.org_id = online_orders.org_id
          AND ur.role IN ('gerente','vendedor','store_manager','store_admin','corp','superadmin','admin_corp')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Corp y superadmin ven todo
DO $$ BEGIN
  CREATE POLICY "corp_ve_todos_online_orders"
    ON public.online_orders FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('corp','superadmin','admin_corp')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Inserción pública: cualquiera puede crear un pedido (para guest checkout)
DO $$ BEGIN
  CREATE POLICY "publico_puede_crear_online_order"
    ON public.online_orders FOR INSERT TO anon, authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Verificar
SELECT 'online_orders creada correctamente ✓' AS resultado;
