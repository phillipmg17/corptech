-- ============================================================
-- CORP TECH ERP — DATOS DE PRUEBA COMPLETOS
-- INSTRUCCIONES: Pega TODO en Supabase → SQL Editor → Run
-- ============================================================

-- ── PASO 1: Agregar columnas que el POS necesita ─────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS emoji      TEXT    DEFAULT '📦';

-- ── PASO 2: Tipo de cambio actual ────────────────────────────
INSERT INTO public.exchange_rates (pair, rate, date, source)
VALUES ('USD/PEN', 3.71, CURRENT_DATE, 'seed-data')
ON CONFLICT DO NOTHING;

-- ── PASO 3: Almacenes ────────────────────────────────────────
INSERT INTO public.warehouses (id, org_id, name, type) VALUES
  ('c1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Almacén Central Corp','central'),
  ('c1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','Almacén Futurteck','store'),
  ('c1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003','Almacén Innovatech','store'),
  ('c1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000004','Almacén WeTech Peru','store')
ON CONFLICT (id) DO NOTHING;

-- ── PASO 4: Productos del catálogo maestro ───────────────────
INSERT INTO public.products (id, corp_id, name, brand, model, category, cost_usd, freight_cost, corp_margin, sale_price, emoji, is_active) VALUES
  ('b1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','iPhone 15 Pro 256GB','Apple','iPhone 15 Pro','phone',   850, 35, 12, 3890, '📱', true),
  ('b1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','Samsung Galaxy S24','Samsung','Galaxy S24','phone',     620, 28, 14, 2790, '📱', true),
  ('b1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','iPad Air M2 64GB','Apple','iPad Air M2','tablet',       480, 22, 15, 2390, '📲', true),
  ('b1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','MacBook Air M3 8GB','Apple','MacBook Air M3','laptop',  1100, 55, 12, 5490, '💻', true),
  ('b1000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','AirPods Pro 2da Gen','Apple','AirPods Pro 2','accessory',170, 12, 18, 890,  '🎧', true),
  ('b1000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','Xiaomi Redmi Note 13','Xiaomi','Redmi Note 13','phone', 150, 10, 20, 699,  '📱', true),
  ('b1000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','Samsung Galaxy Tab A9','Samsung','Tab A9','tablet',    220, 15, 18, 1190, '📲', true),
  ('b1000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','Cable USB-C 2m','Belkin','CAB003','accessory',          8,   2, 40, 45,   '🔌', true),
  ('b1000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000001','Cargador 20W Apple','Apple','MHJA3AM','accessory',      22,  4, 30, 129,  '🔋', true),
  ('b1000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','Funda MagSafe iPhone 15','Apple','MT0N3ZM','accessory', 18,  3, 35, 99,   '🛡️', true)
ON CONFLICT (id) DO NOTHING;

-- ── PASO 5: Precios por tienda ───────────────────────────────
INSERT INTO public.prices (product_id, org_id, corp_price, retail_price, currency) VALUES
-- Futurteck
  ('b1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002', 3500, 3890, 'PEN'),
  ('b1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002', 2500, 2790, 'PEN'),
  ('b1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002', 2100, 2390, 'PEN'),
  ('b1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000002', 5000, 5490, 'PEN'),
  ('b1000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000002',  800,  890, 'PEN'),
  ('b1000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000002',  620,  699, 'PEN'),
-- Innovatech
  ('b1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003', 3500, 3950, 'PEN'),
  ('b1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003', 2500, 2850, 'PEN'),
  ('b1000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000003', 1050, 1190, 'PEN'),
  ('b1000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000003',  800,  920, 'PEN'),
-- WeTech Peru
  ('b1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004', 3500, 3800, 'PEN'),
  ('b1000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000004',  620,  750, 'PEN'),
  ('b1000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000004',   35,   45, 'PEN'),
  ('b1000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000004',  105,  129, 'PEN'),
  ('b1000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000004',   80,   99, 'PEN')
ON CONFLICT (product_id, org_id) DO NOTHING;

-- ── PASO 6: Stock con IMEIs (unidades físicas) ───────────────
-- FUTURTECK (owner_org_id = 002)
INSERT INTO public.stock_items (id, product_id, warehouse_id, imei, status, owner_type, owner_org_id, purchase_price) VALUES
  ('d1000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','358432109876541','available','store','00000000-0000-0000-0000-000000000002',3500),
  ('d1000000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','358432109876542','available','store','00000000-0000-0000-0000-000000000002',3500),
  ('d1000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000002','354687203948571','available','store','00000000-0000-0000-0000-000000000002',2500),
  ('d1000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000002','354687203948572','available','store','00000000-0000-0000-0000-000000000002',2500),
  ('d1000000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000002','F9KPQR2031TABFT','available','store','00000000-0000-0000-0000-000000000002',2100),
  ('d1000000-0000-0000-0000-000000000006','b1000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000002','H7MNX4092APDFT1','available','store','00000000-0000-0000-0000-000000000002', 800),
  ('d1000000-0000-0000-0000-000000000007','b1000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000002','869234012847561','available','store','00000000-0000-0000-0000-000000000002', 620),
-- INNOVATECH (owner_org_id = 003)
  ('d1000000-0000-0000-0000-000000000008','b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003','358432109876543','available','store','00000000-0000-0000-0000-000000000003',3500),
  ('d1000000-0000-0000-0000-000000000009','b1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000003','354687203948573','available','store','00000000-0000-0000-0000-000000000003',2500),
  ('d1000000-0000-0000-0000-000000000010','b1000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000003','T3KWBP8293TABSA','available','store','00000000-0000-0000-0000-000000000003',1050),
  ('d1000000-0000-0000-0000-000000000011','b1000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000003','H7MNX4092APDFT2','available','store','00000000-0000-0000-0000-000000000003', 800),
  ('d1000000-0000-0000-0000-000000000012','b1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000003','354687203948574','available','store','00000000-0000-0000-0000-000000000003',2500),
-- WETECH PERU (owner_org_id = 004)
  ('d1000000-0000-0000-0000-000000000013','b1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000004','358432109876544','available','store','00000000-0000-0000-0000-000000000004',3500),
  ('d1000000-0000-0000-0000-000000000014','b1000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000004','869234012847562','available','store','00000000-0000-0000-0000-000000000004', 620),
  ('d1000000-0000-0000-0000-000000000015','b1000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000004','869234012847563','available','store','00000000-0000-0000-0000-000000000004', 620),
  ('d1000000-0000-0000-0000-000000000016','b1000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000004','CBL-USBC-WT-0001', 'available','store','00000000-0000-0000-0000-000000000004',  35),
  ('d1000000-0000-0000-0000-000000000017','b1000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000004','CBL-USBC-WT-0002', 'available','store','00000000-0000-0000-0000-000000000004',  35),
  ('d1000000-0000-0000-0000-000000000018','b1000000-0000-0000-0000-000000000009','c1000000-0000-0000-0000-000000000004','CHG-20W-WT-00001', 'available','store','00000000-0000-0000-0000-000000000004', 105),
  ('d1000000-0000-0000-0000-000000000019','b1000000-0000-0000-0000-000000000010','c1000000-0000-0000-0000-000000000004','CSE-IP15-WT-0001', 'available','store','00000000-0000-0000-0000-000000000004',  80)
ON CONFLICT (id) DO NOTHING;

-- ── PASO 7: Clientes por tienda ──────────────────────────────
-- FUTURTECK
INSERT INTO public.customers (org_id, full_name, email, phone, id_document, credit_limit, current_debt) VALUES
  ('00000000-0000-0000-0000-000000000002','Carlos Mendoza','carlos.m@gmail.com','987654321','DNI-45678901',1500,0),
  ('00000000-0000-0000-0000-000000000002','Ana Torres','ana.torres@hotmail.com','976543210','DNI-52341678',2000,450),
  ('00000000-0000-0000-0000-000000000002','Luis Quispe','luis.q@gmail.com','965432109','DNI-63452789',800,0),
  ('00000000-0000-0000-0000-000000000002','María Flores','mflores@outlook.com','954321098','DNI-74563890',3000,1200),
-- INNOVATECH
  ('00000000-0000-0000-0000-000000000003','Roberto Silva','rsilva@gmail.com','943210987','DNI-85674901',1000,0),
  ('00000000-0000-0000-0000-000000000003','Patricia Gomez','pgomez@yahoo.com','932109876','DNI-96785012',2500,800),
  ('00000000-0000-0000-0000-000000000003','Diego Ramirez','dramirez@gmail.com','921098765','DNI-07896123',1200,0),
  ('00000000-0000-0000-0000-000000000003','Carmen Vega','cvega@hotmail.com','910987654','DNI-18907234',500,200),
-- WETECH PERU
  ('00000000-0000-0000-0000-000000000004','Javier Castillo','jcastillo@gmail.com','909876543','DNI-29018345',2000,0),
  ('00000000-0000-0000-0000-000000000004','Sandra Huanca','shuanca@gmail.com','898765432','DNI-30129456',1500,600),
  ('00000000-0000-0000-0000-000000000004','Marco Llanos','mllanos@outlook.com','887654321','DNI-41230567',3000,0),
  ('00000000-0000-0000-0000-000000000004','Rosa Condori','rcondori@gmail.com','876543210','DNI-52341678',800,150);

-- ── PASO 8: Usuarios de prueba en Supabase Auth ──────────────
-- Contraseña de todos: Demo1234!
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at,
  confirmation_token, email_change,
  email_change_token_new, recovery_token
) VALUES
-- Gerente Futurteck
  ('00000000-0000-0000-0000-000000000000','a1000000-0000-0000-0000-000000000001',
   'authenticated','authenticated','gerente@futurteck.pe',
   crypt('Demo1234!', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Pedro Gerente Futurteck"}',
   false, NOW(), NOW(), '', '', '', ''),
-- Vendedor Futurteck
  ('00000000-0000-0000-0000-000000000000','a1000000-0000-0000-0000-000000000002',
   'authenticated','authenticated','vendedor@futurteck.pe',
   crypt('Demo1234!', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Juan Vendedor Futurteck"}',
   false, NOW(), NOW(), '', '', '', ''),
-- Gerente Innovatech
  ('00000000-0000-0000-0000-000000000000','a1000000-0000-0000-0000-000000000003',
   'authenticated','authenticated','gerente@innovatechstore.com.pe',
   crypt('Demo1234!', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Sofia Gerente Innovatech"}',
   false, NOW(), NOW(), '', '', '', ''),
-- Vendedor Innovatech
  ('00000000-0000-0000-0000-000000000000','a1000000-0000-0000-0000-000000000004',
   'authenticated','authenticated','vendedor@innovatechstore.com.pe',
   crypt('Demo1234!', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Miguel Vendedor Innovatech"}',
   false, NOW(), NOW(), '', '', '', ''),
-- Gerente WeTech
  ('00000000-0000-0000-0000-000000000000','a1000000-0000-0000-0000-000000000005',
   'authenticated','authenticated','gerente@wetechperu.pe',
   crypt('Demo1234!', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Lucia Gerente WeTech"}',
   false, NOW(), NOW(), '', '', '', ''),
-- Vendedor WeTech
  ('00000000-0000-0000-0000-000000000000','a1000000-0000-0000-0000-000000000006',
   'authenticated','authenticated','vendedor@wetechperu.pe',
   crypt('Demo1234!', gen_salt('bf')), NOW(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Kevin Vendedor WeTech"}',
   false, NOW(), NOW(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- ── PASO 9: Perfiles en tabla users ─────────────────────────
INSERT INTO public.users (id, org_id, full_name, email, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','Pedro Gerente Futurteck',  'gerente@futurteck.pe',               true),
  ('a1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','Juan Vendedor Futurteck',  'vendedor@futurteck.pe',              true),
  ('a1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003','Sofia Gerente Innovatech', 'gerente@innovatechstore.com.pe',      true),
  ('a1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000003','Miguel Vendedor Innovatech','vendedor@innovatechstore.com.pe',    true),
  ('a1000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000004','Lucia Gerente WeTech',     'gerente@wetechperu.pe',              true),
  ('a1000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000004','Kevin Vendedor WeTech',    'vendedor@wetechperu.pe',             true)
ON CONFLICT (id) DO NOTHING;

-- ── PASO 10: Roles ───────────────────────────────────────────
INSERT INTO public.user_roles (user_id, org_id, role) VALUES
  ('a1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','store_manager'),
  ('a1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','seller'),
  ('a1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003','store_manager'),
  ('a1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000003','seller'),
  ('a1000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000004','store_manager'),
  ('a1000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000004','seller')
ON CONFLICT DO NOTHING;

-- ── PASO 11: Cajas abiertas (para que el POS funcione hoy) ───
INSERT INTO public.cash_sessions (id, org_id, cashier_id, opening_amount, status, opened_at) VALUES
  ('e1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001',500,'open', NOW()),
  ('e1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003',500,'open', NOW()),
  ('e1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005',500,'open', NOW())
ON CONFLICT (id) DO NOTHING;

-- ── VERIFICACIÓN FINAL ───────────────────────────────────────
SELECT 'Productos'   AS tabla, COUNT(*) AS total FROM public.products   UNION ALL
SELECT 'Stock items',          COUNT(*)          FROM public.stock_items UNION ALL
SELECT 'Clientes',             COUNT(*)          FROM public.customers   UNION ALL
SELECT 'Usuarios',             COUNT(*)          FROM public.users       UNION ALL
SELECT 'Cajas abiertas',       COUNT(*)          FROM public.cash_sessions WHERE status='open';
