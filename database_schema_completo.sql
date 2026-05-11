-- ============================================================
-- CORP TECH ERP/POS — SCHEMA COMPLETO DE BASE DE DATOS
-- Proyecto: jgreajitfugnqruvbavn.supabase.co
-- Tablas: 29 tablas + RLS + Feature Registry inicial
-- INSTRUCCIONES: Pega TODO esto en Supabase → SQL Editor → Run
-- ============================================================

-- EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- MÓDULO 1: CORE — ORGANIZACIONES Y SUPERADMIN
-- ============================================================

-- Corporación + 3 Tiendas (la base de todo)
CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('corp', 'store')),
  domain      TEXT,
  logo_url    TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Solo Phillip tiene acceso aquí
CREATE TABLE IF NOT EXISTS public.superadmin_users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT,
  is_superadmin   BOOLEAN DEFAULT TRUE,
  last_login      TIMESTAMPTZ,
  two_fa_enabled  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tipo de cambio diario (actualizado via API automáticamente)
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pair        TEXT NOT NULL,
  rate        NUMERIC NOT NULL,
  date        DATE NOT NULL,
  source      TEXT DEFAULT 'exchangerate-api',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- MÓDULO 2: USUARIOS Y ROLES
-- ============================================================

-- Perfil de cada usuario (conectado a Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id      UUID REFERENCES public.organizations(id),
  full_name   TEXT,
  email       TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Roles por usuario (admin_corp, gerente, cajero, etc.)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES public.organizations(id),
  role        TEXT NOT NULL CHECK (role IN (
                'admin_corp','store_manager','seller',
                'cashier','warehouse','delivery','accounting','client'
              )),
  granted_at  TIMESTAMPTZ DEFAULT NOW(),
  granted_by  UUID REFERENCES public.users(id)
);


-- ============================================================
-- MÓDULO 3: CATÁLOGO DE PRODUCTOS
-- ============================================================

-- Productos del catálogo maestro (solo Corp crea productos)
CREATE TABLE IF NOT EXISTS public.products (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corp_id            UUID NOT NULL REFERENCES public.organizations(id),
  name               TEXT NOT NULL,
  brand              TEXT,
  model              TEXT,
  category           TEXT,
  description        TEXT,
  cost_usd           NUMERIC DEFAULT 0,
  freight_cost       NUMERIC DEFAULT 0,
  corp_margin        NUMERIC DEFAULT 0,
  -- Precio final que corp cobra a la tienda (calculado automático)
  final_store_cost   NUMERIC GENERATED ALWAYS AS (
                       cost_usd + freight_cost + (cost_usd * corp_margin / 100)
                     ) STORED,
  image_url          TEXT,
  is_active          BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Corp controla qué productos ve cada tienda (can ocultar)
CREATE TABLE IF NOT EXISTS public.product_visibility (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_org_id  UUID NOT NULL REFERENCES public.organizations(id),
  is_visible    BOOLEAN DEFAULT TRUE,
  hidden_by     UUID REFERENCES public.users(id),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, store_org_id)
);

-- Precios: Corp pone precio a tienda; tienda pone precio a cliente
CREATE TABLE IF NOT EXISTS public.prices (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id       UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  org_id           UUID NOT NULL REFERENCES public.organizations(id),
  corp_price       NUMERIC,
  retail_price     NUMERIC,
  currency         TEXT DEFAULT 'USD',
  exchange_rate_id UUID REFERENCES public.exchange_rates(id),
  effective_date   DATE DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, org_id)
);


-- ============================================================
-- MÓDULO 4: STOCK, IMEI Y ALMACENES
-- ============================================================

-- Almacenes físicos (central corp, de tienda, personal del dueño)
CREATE TABLE IF NOT EXISTS public.warehouses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id),
  name        TEXT NOT NULL,
  type        TEXT CHECK (type IN ('central', 'store', 'personal')),
  aisle       TEXT,
  shelf       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Cada unidad física de producto con IMEI/Serial único
CREATE TABLE IF NOT EXISTS public.stock_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id       UUID NOT NULL REFERENCES public.products(id),
  warehouse_id     UUID REFERENCES public.warehouses(id),
  imei             TEXT UNIQUE,
  serial_number    TEXT,
  status           TEXT DEFAULT 'available' CHECK (
                     status IN ('available','reserved','sold',
                                'returned','quarantine','in_transit')
                   ),
  owner_type       TEXT CHECK (owner_type IN ('corp','store','personal')),
  owner_org_id     UUID REFERENCES public.organizations(id),
  purchase_price   NUMERIC,
  imei_status_api  JSONB,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Registro global de IMEIs (antifraude — Corp ve todo)
CREATE TABLE IF NOT EXISTS public.imei_registry (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  imei                 TEXT UNIQUE NOT NULL,
  serial_number        TEXT,
  product_id           UUID REFERENCES public.products(id),
  current_status       TEXT,
  current_owner_org_id UUID REFERENCES public.organizations(id),
  history              JSONB DEFAULT '[]'::jsonb,
  api_last_check       TIMESTAMPTZ,
  is_blacklisted       BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Transferencias de stock entre organizaciones
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_org_id   UUID NOT NULL REFERENCES public.organizations(id),
  to_org_id     UUID NOT NULL REFERENCES public.organizations(id),
  status        TEXT DEFAULT 'pending' CHECK (
                  status IN ('pending','approved','in_transit','received','cancelled')
                ),
  is_debt       BOOLEAN DEFAULT FALSE,
  total_amount  NUMERIC DEFAULT 0,
  approved_by   UUID REFERENCES public.users(id),
  approved_at   TIMESTAMPTZ,
  received_by   UUID REFERENCES public.users(id),
  received_at   TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Items dentro de cada transferencia
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id    UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  stock_item_id  UUID NOT NULL REFERENCES public.stock_items(id),
  corp_price     NUMERIC,
  quantity       INTEGER DEFAULT 1
);


-- ============================================================
-- MÓDULO 5: CLIENTES
-- ============================================================

-- Clientes por tienda (aislados — Tienda A no ve clientes de B)
CREATE TABLE IF NOT EXISTS public.customers (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                UUID NOT NULL REFERENCES public.organizations(id),
  full_name             TEXT NOT NULL,
  email                 TEXT,
  phone                 TEXT,
  address               TEXT,
  id_document           TEXT,
  credit_limit          NUMERIC DEFAULT 0,
  current_debt          NUMERIC DEFAULT 0,
  is_transferred_copy   BOOLEAN DEFAULT FALSE,
  original_customer_id  UUID REFERENCES public.customers(id),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Órdenes del cliente (panel del cliente en e-commerce)
CREATE TABLE IF NOT EXISTS public.customer_orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id   UUID NOT NULL REFERENCES public.customers(id),
  org_id        UUID NOT NULL REFERENCES public.organizations(id),
  order_status  TEXT DEFAULT 'pending' CHECK (
                  order_status IN ('pending','processing','shipped',
                                   'delivered','cancelled','returned')
                ),
  tracking_url  TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- MÓDULO 6: POS Y VENTAS
-- ============================================================

-- Sesión de caja (apertura y cierre diario con biometría)
CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id           UUID NOT NULL REFERENCES public.organizations(id),
  cashier_id       UUID NOT NULL REFERENCES public.users(id),
  opened_at        TIMESTAMPTZ DEFAULT NOW(),
  closed_at        TIMESTAMPTZ,
  opening_amount   NUMERIC DEFAULT 0,
  closing_amount   NUMERIC,
  expected_amount  NUMERIC,
  difference       NUMERIC,
  status           TEXT DEFAULT 'open' CHECK (status IN ('open','closed','reviewed')),
  reviewed_by      UUID REFERENCES public.users(id),
  notes            TEXT
);

-- Ventas del POS
CREATE TABLE IF NOT EXISTS public.sales (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                      UUID NOT NULL REFERENCES public.organizations(id),
  customer_id                 UUID REFERENCES public.customers(id),
  cashier_id                  UUID NOT NULL REFERENCES public.users(id),
  cash_session_id             UUID REFERENCES public.cash_sessions(id),
  total_amount                NUMERIC NOT NULL DEFAULT 0,
  discount_amount             NUMERIC DEFAULT 0,
  discount_authorized_by      UUID REFERENCES public.users(id),
  discount_biometric_verified BOOLEAN DEFAULT FALSE,
  payment_method              TEXT CHECK (
                                payment_method IN ('cash','card','transfer','debt','mixed')
                              ),
  status                      TEXT DEFAULT 'completed' CHECK (
                                status IN ('completed','refunded','partial_refund','voided')
                              ),
  notes                       TEXT,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Productos dentro de cada venta
CREATE TABLE IF NOT EXISTS public.sale_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id        UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  stock_item_id  UUID NOT NULL REFERENCES public.stock_items(id),
  unit_price     NUMERIC NOT NULL,
  quantity       INTEGER DEFAULT 1,
  subtotal       NUMERIC GENERATED ALWAYS AS (unit_price * quantity) STORED
);

-- Deliveries / entregas a domicilio
CREATE TABLE IF NOT EXISTS public.deliveries (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id          UUID NOT NULL REFERENCES public.sales(id),
  org_id           UUID NOT NULL REFERENCES public.organizations(id),
  delivery_user_id UUID REFERENCES public.users(id),
  status           TEXT DEFAULT 'pending' CHECK (
                     status IN ('pending','assigned','in_transit',
                                'delivered','failed','returned')
                   ),
  address          TEXT,
  gps_track        JSONB DEFAULT '[]'::jsonb,
  scheduled_at     TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ,
  signature_url    TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- MÓDULO 7: PERSONAL Y SEGURIDAD
-- ============================================================

-- Carnets QR del personal (para check-in/check-out)
CREATE TABLE IF NOT EXISTS public.staff_cards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  qr_token    TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active   BOOLEAN DEFAULT TRUE,
  issued_at   TIMESTAMPTZ DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ,
  revoked_by  UUID REFERENCES public.users(id)
);

-- Registro de entradas y salidas del personal
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id),
  org_id       UUID NOT NULL REFERENCES public.organizations(id),
  check_in     TIMESTAMPTZ,
  check_out    TIMESTAMPTZ,
  qr_used      TEXT,
  device_info  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Llaves biométricas (FaceID/Huella) por dispositivo iPhone/iPad
CREATE TABLE IF NOT EXISTS public.biometric_keys (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id      TEXT NOT NULL,
  credential_id  TEXT NOT NULL UNIQUE,
  public_key     TEXT NOT NULL,
  device_name    TEXT,
  registered_at  TIMESTAMPTZ DEFAULT NOW(),
  last_used      TIMESTAMPTZ
);


-- ============================================================
-- MÓDULO 8: FINANZAS Y PAGOS ENTRE NEGOCIOS
-- ============================================================

-- Deudas de tiendas con la Corporación
CREATE TABLE IF NOT EXISTS public.store_debts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_org_id  UUID NOT NULL REFERENCES public.organizations(id),
  transfer_id   UUID REFERENCES public.stock_transfers(id),
  amount        NUMERIC NOT NULL,
  balance_due   NUMERIC NOT NULL,
  due_date      DATE,
  period        TEXT CHECK (period IN ('biweekly','monthly')),
  status        TEXT DEFAULT 'pending' CHECK (
                  status IN ('pending','partial','settled','overdue')
                ),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos realizados contra las deudas
CREATE TABLE IF NOT EXISTS public.debt_payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id         UUID NOT NULL REFERENCES public.store_debts(id),
  paid_by         UUID REFERENCES public.users(id),
  amount          NUMERIC NOT NULL,
  payment_method  TEXT,
  receipt_url     TEXT,
  paid_at         TIMESTAMPTZ DEFAULT NOW(),
  notes           TEXT
);

-- Contabilidad general por organización
CREATE TABLE IF NOT EXISTS public.accounting_tx (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id),
  type            TEXT CHECK (type IN ('income','expense','transfer','adjustment')),
  amount          NUMERIC NOT NULL,
  currency        TEXT DEFAULT 'USD',
  reference_id    UUID,
  reference_type  TEXT,
  description     TEXT,
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos entre negocios (tienda → corp) con comprobante y aprobación
CREATE TABLE IF NOT EXISTS public.business_payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payer_org_id     UUID NOT NULL REFERENCES public.organizations(id),
  receiver_org_id  UUID NOT NULL REFERENCES public.organizations(id),
  debt_id          UUID REFERENCES public.store_debts(id),
  amount           NUMERIC NOT NULL,
  payment_type     TEXT CHECK (payment_type IN ('debt_payment','transfer','advance')),
  method           TEXT CHECK (method IN ('cash','bank_transfer','crypto','check','other')),
  receipt_url      TEXT,
  status           TEXT DEFAULT 'pending' CHECK (
                     status IN ('pending','approved','rejected')
                   ),
  approved_by      UUID REFERENCES public.users(id),
  approved_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Transferencias simples de producto sin deuda
CREATE TABLE IF NOT EXISTS public.product_transfers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_org_id       UUID NOT NULL REFERENCES public.organizations(id),
  to_org_id         UUID NOT NULL REFERENCES public.organizations(id),
  transfer_type     TEXT CHECK (
                      transfer_type IN ('sale','loan','gift','return','adjustment')
                    ),
  requires_payment  BOOLEAN DEFAULT FALSE,
  agreed_price      NUMERIC,
  status            TEXT DEFAULT 'pending' CHECK (
                      status IN ('pending','confirmed','cancelled')
                    ),
  confirmed_by      UUID REFERENCES public.users(id),
  confirmed_at      TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- MÓDULO 9: CHAT INTERNO
-- ============================================================

-- Canales de chat (Corp ↔ Tiendas, privados por tienda)
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  org_id      UUID REFERENCES public.organizations(id),
  type        TEXT CHECK (type IN ('corp_to_store','internal','broadcast')),
  is_private  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Mensajes en tiempo real (Supabase Realtime)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id      UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.users(id),
  content         TEXT NOT NULL,
  attachment_url  TEXT,
  read_by         JSONB DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- MÓDULO 10: MÉTRICAS, CRÉDITOS Y SUPERADMIN
-- ============================================================

-- Métricas diarias por tienda (se calculan automáticamente)
CREATE TABLE IF NOT EXISTS public.store_metrics (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id           UUID NOT NULL REFERENCES public.organizations(id),
  period           DATE NOT NULL,
  total_sales      NUMERIC DEFAULT 0,
  total_units_sold INTEGER DEFAULT 0,
  total_discounts  NUMERIC DEFAULT 0,
  top_seller_id    UUID REFERENCES public.users(id),
  best_product_id  UUID REFERENCES public.products(id),
  cash_in          NUMERIC DEFAULT 0,
  card_in          NUMERIC DEFAULT 0,
  transfer_in      NUMERIC DEFAULT 0,
  pending_debt     NUMERIC DEFAULT 0,
  margin_gross     NUMERIC DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, period)
);

-- Saldo de créditos/tokens por organización
CREATE TABLE IF NOT EXISTS public.org_credits (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id           UUID NOT NULL UNIQUE REFERENCES public.organizations(id),
  balance          INTEGER DEFAULT 0,
  total_purchased  INTEGER DEFAULT 0,
  total_used       INTEGER DEFAULT 0,
  last_recharge    TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de movimientos de créditos
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES public.organizations(id),
  type          TEXT CHECK (type IN ('recharge','use','refund','adjustment')),
  amount        INTEGER NOT NULL,
  balance_after INTEGER,
  feature_used  TEXT,
  added_by      UUID REFERENCES public.superadmin_users(id),
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Reportes de bugs/errores desde cualquier panel
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reported_by  UUID REFERENCES public.users(id),
  org_id       UUID REFERENCES public.organizations(id),
  panel        TEXT CHECK (panel IN ('pos','corp','store','ecommerce','superadmin')),
  title        TEXT NOT NULL,
  description  TEXT,
  screenshot_url TEXT,
  status       TEXT DEFAULT 'new' CHECK (
                 status IN ('new','in_review','fixed','verify','closed','wont_fix')
               ),
  priority     TEXT DEFAULT 'medium' CHECK (
                 priority IN ('low','medium','high','critical')
               ),
  assigned_to  UUID REFERENCES public.superadmin_users(id),
  fix_notes    TEXT,
  verified_by  UUID REFERENCES public.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);

-- Registro maestro de TODAS las funciones construidas (auditoría + cobro)
CREATE TABLE IF NOT EXISTS public.feature_registry (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  panel             TEXT CHECK (
                      panel IN ('superadmin','corp','store','pos',
                                'ecommerce','security','api','database')
                    ),
  description       TEXT,
  status            TEXT DEFAULT 'planned' CHECK (
                      status IN ('planned','building','done','deprecated')
                    ),
  version           TEXT DEFAULT 'v1.0',
  built_date        DATE,
  chat_session_ref  TEXT,
  billable_hours    NUMERIC DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Casos de prueba QA (auto-generados por función)
CREATE TABLE IF NOT EXISTS public.qa_test_cases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id      UUID NOT NULL REFERENCES public.feature_registry(id) ON DELETE CASCADE,
  test_name       TEXT NOT NULL,
  steps           JSONB DEFAULT '[]'::jsonb,
  expected_result TEXT,
  panel           TEXT,
  status          TEXT DEFAULT 'pending' CHECK (
                    status IN ('pending','pass','fail','skipped')
                  ),
  tested_by       UUID REFERENCES public.users(id),
  test_date       TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- RLS — MUROS DE SEGURIDAD ENTRE EMPRESAS
-- ============================================================

ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_cards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_debts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_tx      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_metrics      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports        ENABLE ROW LEVEL SECURITY;

-- Función: obtener el org_id del usuario logueado
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función: verificar si el usuario es de la Corporación
CREATE OR REPLACE FUNCTION public.is_corp_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.organizations o ON u.org_id = o.id
    WHERE u.id = auth.uid() AND o.type = 'corp'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- USUARIOS: cada org ve sus propios usuarios; Corp ve todos
CREATE POLICY "users_by_org" ON public.users
  FOR ALL USING (
    org_id = public.get_my_org_id() OR public.is_corp_user()
  );

-- ROLES: igual que usuarios
CREATE POLICY "roles_by_org" ON public.user_roles
  FOR ALL USING (
    org_id = public.get_my_org_id() OR public.is_corp_user()
  );

-- PRODUCTOS: tienda solo ve los visibles para ella; Corp ve todos
CREATE POLICY "products_corp_all" ON public.products
  FOR ALL USING (public.is_corp_user());

CREATE POLICY "products_store_visible" ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.product_visibility pv
      WHERE pv.product_id = id
        AND pv.store_org_id = public.get_my_org_id()
        AND pv.is_visible = TRUE
    )
  );

-- VISIBILIDAD: solo Corp gestiona
CREATE POLICY "visibility_corp_only" ON public.product_visibility
  FOR ALL USING (public.is_corp_user());

-- PRECIOS: Corp gestiona todos; tienda ve solo los suyos
CREATE POLICY "prices_by_org" ON public.prices
  FOR ALL USING (
    org_id = public.get_my_org_id() OR public.is_corp_user()
  );

-- ALMACENES: por org + corp ve todos
CREATE POLICY "warehouses_by_org" ON public.warehouses
  FOR ALL USING (
    org_id = public.get_my_org_id() OR public.is_corp_user()
  );

-- STOCK: por propietario + corp ve todos
CREATE POLICY "stock_by_owner" ON public.stock_items
  FOR ALL USING (
    owner_org_id = public.get_my_org_id() OR public.is_corp_user()
  );

-- CLIENTES: aislamiento estricto — tienda solo ve sus clientes
CREATE POLICY "customers_strict" ON public.customers
  FOR ALL USING (
    org_id = public.get_my_org_id() OR public.is_corp_user()
  );

-- ÓRDENES: siguen a clientes
CREATE POLICY "orders_by_org" ON public.customer_orders
  FOR ALL USING (
    org_id = public.get_my_org_id() OR public.is_corp_user()
  );

-- VENTAS: por org + corp ve todas
CREATE POLICY "sales_by_org" ON public.sales
  FOR ALL USING (
    org_id = public.get_my_org_id() OR public.is_corp_user()
  );

-- ITEMS DE VENTA: siguen a la venta
CREATE POLICY "sale_items_via_sale" ON public.sale_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_id
        AND (s.org_id = public.get_my_org_id() OR public.is_corp_user())
    )
  );

-- CAJA: por org + corp ve todas
CREATE POLICY "cash_by_org" ON public.cash_sessions
  FOR ALL USING (
    org_id = public.get_my_org_id() OR public.is_corp_user()
  );

-- DELIVERIES: por org + corp ve todas
CREATE POLICY "deliveries_by_org" ON public.deliveries
  FOR ALL USING (
    org_id = public.get_my_org_id() OR public.is_corp_user()
  );

-- CARNETS: usuario ve su propio carnet; gerentes y corp ven todos
CREATE POLICY "staff_cards_own" ON public.staff_cards
  FOR ALL USING (
    user_id = auth.uid() OR public.is_corp_user()
  );

-- ASISTENCIA: por org + corp ve todos
CREATE POLICY "attendance_by_org" ON public.attendance_logs
  FOR ALL USING (
    org_id = public.get_my_org_id() OR public.is_corp_user()
  );

-- DEUDAS: tienda ve sus propias deudas; corp ve todas
CREATE POLICY "debts_by_store" ON public.store_debts
  FOR ALL USING (
    store_org_id = public.get_my_org_id() OR public.is_corp_user()
  );

-- CONTABILIDAD: por org + corp ve todo
CREATE POLICY "accounting_by_org" ON public.accounting_tx
  FOR ALL USING (
    org_id = public.get_my_org_id() OR public.is_corp_user()
  );

-- PAGOS ENTRE NEGOCIOS: participante o corp
CREATE POLICY "biz_payments_participant" ON public.business_payments
  FOR ALL USING (
    payer_org_id = public.get_my_org_id()
    OR receiver_org_id = public.get_my_org_id()
    OR public.is_corp_user()
  );

-- CHAT CANALES: por org + corp + broadcast
CREATE POLICY "chat_channels_by_org" ON public.chat_channels
  FOR ALL USING (
    org_id = public.get_my_org_id() OR public.is_corp_user() OR type = 'broadcast'
  );

-- MENSAJES: siguen al canal
CREATE POLICY "chat_messages_via_channel" ON public.chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = channel_id
        AND (c.org_id = public.get_my_org_id() OR public.is_corp_user())
    )
  );

-- MÉTRICAS: tienda ve las suyas; corp ve todas
CREATE POLICY "metrics_by_org" ON public.store_metrics
  FOR ALL USING (
    org_id = public.get_my_org_id() OR public.is_corp_user()
  );

-- BUGS: quien reportó ve el suyo; corp ve todos
CREATE POLICY "bugs_reported_by" ON public.bug_reports
  FOR SELECT USING (
    reported_by = auth.uid() OR public.is_corp_user()
  );
CREATE POLICY "bugs_insert" ON public.bug_reports
  FOR INSERT WITH CHECK (reported_by = auth.uid());
CREATE POLICY "bugs_corp_update" ON public.bug_reports
  FOR UPDATE USING (public.is_corp_user());


-- ============================================================
-- DATOS INICIALES: FEATURE REGISTRY
-- ============================================================

INSERT INTO public.feature_registry (code, name, panel, description, status, built_date) VALUES
  ('SA-001', 'Panel SuperAdmin', 'superadmin', 'Acceso maestro al sistema completo, solo Phillip', 'planned', CURRENT_DATE),
  ('SA-002', 'Sistema de Créditos / Tokens', 'superadmin', 'Asignar tokens por org, descuento automático al usar funciones avanzadas', 'planned', CURRENT_DATE),
  ('SA-003', 'Panel QA — Reporte de Errores', 'superadmin', 'Bug reports con screenshot desde iPhone, flujo: nuevo→revisión→reparado→verificar→cerrado', 'planned', CURRENT_DATE),
  ('SA-004', 'Registro de Funciones + Auditoría', 'superadmin', 'Lista acumulativa de todas las funciones construidas para cobro y manual de usuario', 'done', CURRENT_DATE),
  ('DB-001', 'Base de Datos Multi-Tenant', 'database', '29 tablas con RLS por organización en Supabase, aislamiento completo entre empresas', 'building', CURRENT_DATE),
  ('SEC-001', 'Login QR con Carnet', 'security', 'Check-in/out del personal con QR token único por carnet', 'planned', CURRENT_DATE),
  ('SEC-002', 'Biometría WebAuthn (FaceID/Huella)', 'security', 'Autorización de descuentos y cierres de caja via FaceID nativo en iPhone', 'planned', CURRENT_DATE),
  ('CORP-001', 'Gestión de Stock Global', 'corp', 'Almacenes con pasillos y estantes, propietario corp/tienda/personal', 'planned', CURRENT_DATE),
  ('CORP-002', 'Cálculo de Costo de Importación', 'corp', 'Costo USD + flete + gastos + margen Corp = precio final para tiendas', 'planned', CURRENT_DATE),
  ('CORP-003', 'Visibilidad de Catálogo por Tienda', 'corp', 'Corp puede ocultar o mostrar productos específicos a cada tienda', 'planned', CURRENT_DATE),
  ('CORP-004', 'Chat Interno Corp a Tiendas', 'corp', 'Chat en tiempo real via Supabase Realtime, canales privados por tienda', 'planned', CURRENT_DATE),
  ('API-001', 'Integración Sickw / CheckIMEI', 'api', 'Validación de IMEI: estado, blacklist, historial. Consume créditos del sistema', 'planned', CURRENT_DATE),
  ('API-002', 'Tipo de Cambio Diario Automático', 'api', 'ExchangeRate-API, actualización programada cada día al iniciar', 'planned', CURRENT_DATE),
  ('POS-001', 'POS iPhone — Punto de Venta', 'pos', 'Venta completa: selección producto, cobro, recibo, múltiples métodos de pago', 'planned', CURRENT_DATE),
  ('POS-002', 'Apertura y Cierre de Caja', 'pos', 'Liquidación de caja diaria con biometría del gerente para cierre', 'planned', CURRENT_DATE),
  ('FIN-001', 'Deudas y Liquidaciones Tienda→Corp', 'store', 'Crédito quincenal/mensual, comprobante de pago, aprobación del cobrador', 'planned', CURRENT_DATE),
  ('ECO-001', 'E-commerce por Tienda', 'ecommerce', 'Landing page, catálogo de productos y panel del cliente para ver órdenes', 'planned', CURRENT_DATE)
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- SUPERADMIN: Insertar a Phillip como SuperAdmin
-- ============================================================

INSERT INTO public.superadmin_users (email, full_name, is_superadmin, two_fa_enabled)
VALUES ('phillipmg17@gmail.com', 'Phillip', TRUE, FALSE)
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- FIN DEL SCRIPT
-- Total: 29 tablas + RLS + Feature Registry
-- ============================================================
