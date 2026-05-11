-- ============================================================
-- CORP TECH ERP/POS — DATOS INICIALES: ORGANIZACIONES
-- INSTRUCCIONES: Pega esto en Supabase → SQL Editor → Run
-- ============================================================

INSERT INTO public.organizations (id, name, type, domain, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Corp Tech',        'corp',  'corptech.pe',              TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Futurteck',        'store', 'futurteck.pe',              TRUE),
  ('00000000-0000-0000-0000-000000000003', 'Innovatech Store', 'store', 'innovatechstore.com.pe',    TRUE),
  ('00000000-0000-0000-0000-000000000004', 'WeTech Peru',      'store', 'wetechperu.pe',             TRUE)
ON CONFLICT (id) DO NOTHING;

-- Crear saldo de créditos inicial para cada organización (0 tokens)
INSERT INTO public.org_credits (org_id, balance, total_purchased, total_used) VALUES
  ('00000000-0000-0000-0000-000000000001', 0, 0, 0),
  ('00000000-0000-0000-0000-000000000002', 0, 0, 0),
  ('00000000-0000-0000-0000-000000000003', 0, 0, 0),
  ('00000000-0000-0000-0000-000000000004', 0, 0, 0)
ON CONFLICT (org_id) DO NOTHING;

-- Verificar que todo quedó bien
SELECT name, type, domain FROM public.organizations ORDER BY type DESC, name;
