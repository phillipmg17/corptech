-- ============================================================
--  CORP TECH — Tablas Financieras + Liquidaciones v5
--  Limpia tablas anteriores incompletas y las recrea desde cero
-- ============================================================

-- Borrar tablas incompletas (orden inverso por FKs)
DROP TABLE IF EXISTS calendario_liquidaciones  CASCADE;
DROP TABLE IF EXISTS liquidaciones_plataforma   CASCADE;
DROP TABLE IF EXISTS tienda_plataformas         CASCADE;
DROP TABLE IF EXISTS liquidaciones              CASCADE;
DROP TABLE IF EXISTS import_batches             CASCADE;
DROP TABLE IF EXISTS cash_accounts              CASCADE;
DROP TABLE IF EXISTS plataformas_venta          CASCADE;

-- ─────────────────────────────────────────────
-- 1. CASH ACCOUNTS
-- ─────────────────────────────────────────────
CREATE TABLE cash_accounts (
  id           UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id       UUID          REFERENCES organizations(id) ON DELETE CASCADE,
  nombre       TEXT          NOT NULL,
  tipo         TEXT          NOT NULL DEFAULT 'banco'
                             CHECK (tipo IN ('banco','efectivo','plataforma','otro')),
  moneda       TEXT          NOT NULL DEFAULT 'PEN'
                             CHECK (moneda IN ('PEN','USD')),
  saldo        DECIMAL(14,2) DEFAULT 0,
  notas        TEXT,
  updated_at   TIMESTAMPTZ   DEFAULT NOW(),
  updated_by   UUID          REFERENCES users(id),
  created_at   TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE cash_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY cash_accounts_policy ON cash_accounts
  USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('superadmin','corp','admin_corp')
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.org_id = cash_accounts.org_id)
  );

-- ─────────────────────────────────────────────
-- 2. IMPORT BATCHES
-- ─────────────────────────────────────────────
CREATE TABLE import_batches (
  id                    UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id                UUID          REFERENCES organizations(id) ON DELETE CASCADE,
  descripcion           TEXT,
  proveedor             TEXT,
  fecha_compra          DATE,
  fecha_llegada_est     DATE,
  fecha_llegada_real    DATE,
  estado                TEXT          NOT NULL DEFAULT 'en_transito'
                                      CHECK (estado IN ('en_transito','en_lima','distribuido')),
  num_unidades          INTEGER       DEFAULT 1,
  costo_usd             DECIMAL(14,2) DEFAULT 0,
  flete_usd             DECIMAL(14,2) DEFAULT 0,
  seguro_usd            DECIMAL(14,2) DEFAULT 0,
  arancel_pct           DECIMAL(6,3)  DEFAULT 0,
  igv_pct               DECIMAL(6,3)  DEFAULT 18,
  gastos_lima_pen       DECIMAL(14,2) DEFAULT 0,
  tipo_cambio_usado     DECIMAL(10,5),
  subtotal_usd          DECIMAL(14,2),
  arancel_usd           DECIMAL(14,2),
  igv_usd               DECIMAL(14,2),
  costo_landed_usd      DECIMAL(14,2),
  costo_landed_pen      DECIMAL(14,2),
  margen_pct            DECIMAL(6,2)  DEFAULT 30,
  precio_sugerido_pen   DECIMAL(14,2),
  notas                 TEXT,
  created_by            UUID          REFERENCES users(id),
  created_at            TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY import_batches_policy ON import_batches
  USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('superadmin','corp','admin_corp')
  );

-- ─────────────────────────────────────────────
-- 3. LIQUIDACIONES
-- ─────────────────────────────────────────────
CREATE TABLE liquidaciones (
  id                        UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  store_org_id              UUID          REFERENCES organizations(id),
  corp_org_id               UUID          REFERENCES organizations(id),
  periodo_inicio            DATE          NOT NULL,
  periodo_fin               DATE          NOT NULL,
  descripcion               TEXT,
  total_ventas_pen          DECIMAL(14,2) DEFAULT 0,
  valor_productos_pen       DECIMAL(14,2) DEFAULT 0,
  comision_plataforma_pen   DECIMAL(14,2) DEFAULT 0,
  ajustes_pen               DECIMAL(14,2) DEFAULT 0,
  notas_ajuste              TEXT,
  monto_neto_pen            DECIMAL(14,2) DEFAULT 0,
  estado                    TEXT          NOT NULL DEFAULT 'enviada'
                                          CHECK (estado IN ('enviada','pagada','aprobada','rechazada')),
  comprobante_url           TEXT,
  notas_corp                TEXT,
  aprobado_por              UUID          REFERENCES users(id),
  aprobado_at               TIMESTAMPTZ,
  created_by                UUID          REFERENCES users(id),
  created_at                TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE liquidaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY liquidaciones_policy ON liquidaciones
  USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('superadmin','corp','admin_corp')
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.org_id = liquidaciones.store_org_id)
  );

-- ─────────────────────────────────────────────
-- 4. PLATAFORMAS DE VENTA
-- ─────────────────────────────────────────────
CREATE TABLE plataformas_venta (
  id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre            TEXT          NOT NULL,
  emoji             TEXT          DEFAULT '🏪',
  logo_url          TEXT,
  comision_pct      DECIMAL(6,2)  DEFAULT 0,
  periodicidad      TEXT          DEFAULT 'mensual'
                                  CHECK (periodicidad IN ('semanal','quincenal','mensual','otro')),
  dia_liquidacion   INTEGER       DEFAULT 1,
  metodo_pago       TEXT          DEFAULT 'transferencia',
  instrucciones     TEXT,
  activo            BOOLEAN       DEFAULT TRUE,
  created_at        TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE plataformas_venta ENABLE ROW LEVEL SECURITY;
CREATE POLICY plataformas_venta_read ON plataformas_venta
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY plataformas_venta_write ON plataformas_venta
  FOR ALL USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('superadmin','corp','admin_corp')
  );

-- ─────────────────────────────────────────────
-- 5. TIENDA_PLATAFORMAS
-- ─────────────────────────────────────────────
CREATE TABLE tienda_plataformas (
  id                UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id            UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plataforma_id     UUID          NOT NULL REFERENCES plataformas_venta(id) ON DELETE CASCADE,
  activo            BOOLEAN       DEFAULT TRUE,
  cuenta_id_externo TEXT,
  notas             TEXT,
  activado_por      UUID          REFERENCES users(id),
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE(org_id, plataforma_id)
);
ALTER TABLE tienda_plataformas ENABLE ROW LEVEL SECURITY;
CREATE POLICY tienda_plataformas_policy ON tienda_plataformas
  USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('superadmin','corp','admin_corp')
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.org_id = tienda_plataformas.org_id)
  );

-- ─────────────────────────────────────────────
-- 6. LIQUIDACIONES_PLATAFORMA
-- ─────────────────────────────────────────────
CREATE TABLE liquidaciones_plataforma (
  id                  UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  store_org_id        UUID          REFERENCES organizations(id),
  plataforma_id       UUID          REFERENCES plataformas_venta(id),
  periodo_inicio      DATE,
  periodo_fin         DATE,
  ventas_brutas_pen   DECIMAL(14,2) DEFAULT 0,
  comisiones_pen      DECIMAL(14,2) DEFAULT 0,
  cargos_pen          DECIMAL(14,2) DEFAULT 0,
  ajustes_pen         DECIMAL(14,2) DEFAULT 0,
  neto_plataforma_pen DECIMAL(14,2) DEFAULT 0,
  deposito_recibido   DECIMAL(14,2) DEFAULT 0,
  diferencia_pen      DECIMAL(14,2) DEFAULT 0,
  archivo_url         TEXT,
  estado              TEXT          DEFAULT 'pendiente'
                                    CHECK (estado IN ('pendiente','revisado','aprobado','rechazado')),
  notas_tienda        TEXT,
  notas_corp          TEXT,
  revisado_por        UUID          REFERENCES users(id),
  revisado_at         TIMESTAMPTZ,
  created_by          UUID          REFERENCES users(id),
  created_at          TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE liquidaciones_plataforma ENABLE ROW LEVEL SECURITY;
CREATE POLICY liq_plat_policy ON liquidaciones_plataforma
  USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('superadmin','corp','admin_corp')
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.org_id = liquidaciones_plataforma.store_org_id)
  );

-- ─────────────────────────────────────────────
-- 7. CALENDARIO_LIQUIDACIONES
-- ─────────────────────────────────────────────
CREATE TABLE calendario_liquidaciones (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  store_org_id    UUID          REFERENCES organizations(id),
  plataforma_id   UUID          REFERENCES plataformas_venta(id),
  titulo          TEXT          NOT NULL,
  fecha_esperada  DATE          NOT NULL,
  tipo            TEXT          DEFAULT 'plataforma'
                               CHECK (tipo IN ('plataforma','corp','otro')),
  estado          TEXT          DEFAULT 'pendiente'
                               CHECK (estado IN ('pendiente','completado','vencido')),
  notas           TEXT,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE calendario_liquidaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY calendario_policy ON calendario_liquidaciones
  USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) IN ('superadmin','corp','admin_corp')
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.org_id = calendario_liquidaciones.store_org_id)
  );

-- ─────────────────────────────────────────────
-- 8. PLATAFORMAS INICIALES
-- ─────────────────────────────────────────────
INSERT INTO plataformas_venta (nombre, emoji, comision_pct, periodicidad, dia_liquidacion, metodo_pago, instrucciones)
VALUES
  ('MercadoLibre',        '🟡', 13.5, 'quincenal', 15, 'transferencia', 'Liquidación días 15 y último de mes. Reporte desde Mis Ventas.'),
  ('Saga Falabella',      '🔴', 18.0, 'mensual',   10, 'transferencia', 'Liquidación mensual día 10. Solicitar reporte al ejecutivo.'),
  ('eBay',                '🟠', 12.9, 'mensual',    1, 'paypal',        'Liquidación automática día 1. Reporte en Seller Hub.'),
  ('Facebook Marketplace','🔵',  0.0, 'semanal',    7, 'efectivo',      'Sin comisión. Pago directo al entregar.'),
  ('Linio',               '🟤', 15.0, 'quincenal', 20, 'transferencia', 'Liquidación días 5 y 20 de cada mes.'),
  ('OLX',                 '🟢',  0.0, 'mensual',    1, 'efectivo',      'Plataforma gratuita. Sin liquidación automática.');

-- ─────────────────────────────────────────────
-- 9. FEATURE REGISTRY
-- ─────────────────────────────────────────────
INSERT INTO feature_registry (code, name, description, panel, status, version)
VALUES
  ('CASH_ACCOUNTS',     'Flujo de Caja',                        'Saldos en bancos, plataformas y efectivo',        'corp',  'done', '1.0'),
  ('IMPORT_BATCHES',    'Lotes de Importación USA',              'Calculadora Costo Landed + lotes importados',     'corp',  'done', '1.0'),
  ('LIQUIDACIONES',     'Liquidaciones Corp→Tienda',             'Liquidación periódica entre Corp y tiendas',      'corp',  'done', '1.0'),
  ('PLATAFORMAS_VENTA', 'Catálogo Plataformas de Venta',         'MercadoLibre, Saga, eBay, FB Marketplace y más', 'corp',  'done', '1.0'),
  ('LIQ_PLATAFORMA',    'Liquidaciones por Plataforma (Tienda)', 'Tienda sube reporte, Corp concilia y aprueba',   'store', 'done', '1.0'),
  ('CALENDARIO_LIQ',    'Calendario de Liquidaciones',           'Fechas de pago por tienda y plataforma',         'store', 'done', '1.0')
ON CONFLICT (code) DO NOTHING;
