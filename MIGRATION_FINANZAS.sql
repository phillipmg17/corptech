-- ══════════════════════════════════════════════════════════════
--  MÓDULO FINANCIERO COMPLETO — Sueldos, Deudores, Deudas
--  Copia y ejecuta en Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- ── 1. EMPLEADOS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id          uuid NOT NULL,
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name       text NOT NULL,
  email           text,
  phone           text,
  role_title      text DEFAULT 'Empleado',
  salary          numeric(12,2) DEFAULT 0,
  salary_currency text DEFAULT 'PEN',
  salary_period   text DEFAULT 'mensual',  -- mensual | quincenal | semanal | diario
  start_date      date,
  end_date        date,
  is_active       boolean DEFAULT true,
  notes           text,
  created_by      uuid,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── 2. PAGOS DE SUELDO ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_payments (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id    uuid REFERENCES employees(id) ON DELETE CASCADE,
  org_id         uuid NOT NULL,
  amount         numeric(12,2) DEFAULT 0,
  currency       text DEFAULT 'PEN',
  period_label   text,           -- ej: "Mayo 2026"
  period_start   date,
  period_end     date,
  payment_date   date DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'efectivo',
  status         text DEFAULT 'pagado',   -- pendiente | pagado
  notes          text,
  created_by     uuid,
  created_at     timestamptz DEFAULT now()
);

-- ── 3. DEUDORES (nos deben a nosotros) ────────────────────────
CREATE TABLE IF NOT EXISTS debtors (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id           uuid NOT NULL,
  name             text NOT NULL,
  phone            text,
  email            text,
  description      text,
  principal_amount numeric(12,2) DEFAULT 0,
  currency         text DEFAULT 'PEN',
  interest_rate    numeric(7,3) DEFAULT 0,   -- % (mensual o anual según interest_type)
  interest_type    text DEFAULT 'none',      -- none | monthly | annual
  start_date       date DEFAULT CURRENT_DATE,
  due_date         date,
  amount_paid      numeric(12,2) DEFAULT 0,
  status           text DEFAULT 'activo',    -- activo | pagado | vencido | cancelado
  notes            text,
  created_by       uuid,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ── 4. DEUDAS DE LA EMPRESA (nosotros debemos) ───────────────
CREATE TABLE IF NOT EXISTS company_debts (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id           uuid NOT NULL,
  creditor_name    text NOT NULL,
  description      text,
  principal_amount numeric(12,2) DEFAULT 0,
  currency         text DEFAULT 'PEN',
  interest_rate    numeric(7,3) DEFAULT 0,
  interest_type    text DEFAULT 'none',      -- none | monthly | annual
  start_date       date DEFAULT CURRENT_DATE,
  due_date         date,
  amount_paid      numeric(12,2) DEFAULT 0,
  status           text DEFAULT 'activo',    -- activo | pagado | vencido | cancelado
  notes            text,
  created_by       uuid,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ── RLS — Permitir acceso a usuarios autenticados ─────────────
ALTER TABLE employees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debtors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_debts   ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "auth_all_employees"       ON employees       FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_all_salary_payments" ON salary_payments  FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_all_debtors"         ON debtors          FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_all_company_debts"   ON company_debts    FOR ALL TO authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
