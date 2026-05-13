-- ============================================================
--  FASE 9 — Admins Corp Tech
--  Crea 2 usuarios con rol admin_corp
--  Pueden: entrar a tiendas, crear store_admin y vendedores
--  NO pueden: acceder al SuperAdmin panel
--  Corre esto en Supabase SQL Editor del proyecto jgreajitfugnqruvbavn
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════
--  ADMIN 1 — Fabián Arellano Prado
-- ═══════════════════════════════════════════════════════════
DO $$
DECLARE
  fabian_id UUID;
BEGIN
  -- Verificar si ya existe
  SELECT id INTO fabian_id FROM auth.users WHERE email = 'fabyarepra@gmail.com';

  -- Crear en auth.users si no existe
  IF fabian_id IS NULL THEN
    fabian_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      fabian_id,
      'authenticated', 'authenticated',
      'fabyarepra@gmail.com',
      crypt('123Abc!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Fabián Arellano Prado"}',
      false, ''
    );
    RAISE NOTICE 'Auth user creado para Fabián: %', fabian_id;
  ELSE
    RAISE NOTICE 'Auth user ya existía para Fabián: %', fabian_id;
  END IF;

  -- Insertar en public.users
  INSERT INTO public.users (id, full_name, email, created_at)
  VALUES (fabian_id, 'Fabián Arellano Prado', 'fabyarepra@gmail.com', now())
  ON CONFLICT (id) DO UPDATE SET full_name = 'Fabián Arellano Prado';

  -- Asignar rol admin_corp con org_id = Corp
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = fabian_id) THEN
    UPDATE public.user_roles SET role = 'admin_corp', org_id = '00000000-0000-0000-0000-000000000001' WHERE user_id = fabian_id;
  ELSE
    INSERT INTO public.user_roles (user_id, role, org_id) VALUES (fabian_id, 'admin_corp', '00000000-0000-0000-0000-000000000001');
  END IF;

  RAISE NOTICE '✅ Fabián Arellano listo con rol admin_corp';
END $$;

-- ═══════════════════════════════════════════════════════════
--  ADMIN 2 — Jackeline Chonate Ventura
-- ═══════════════════════════════════════════════════════════
DO $$
DECLARE
  jackeline_id UUID;
BEGIN
  -- Verificar si ya existe
  SELECT id INTO jackeline_id FROM auth.users WHERE email = 'jackeline.chonate.v@gmail.com';

  -- Crear en auth.users si no existe
  IF jackeline_id IS NULL THEN
    jackeline_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      jackeline_id,
      'authenticated', 'authenticated',
      'jackeline.chonate.v@gmail.com',
      crypt('123Abc!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Jackeline Chonate Ventura"}',
      false, ''
    );
    RAISE NOTICE 'Auth user creado para Jackeline: %', jackeline_id;
  ELSE
    RAISE NOTICE 'Auth user ya existía para Jackeline: %', jackeline_id;
  END IF;

  -- Insertar en public.users
  INSERT INTO public.users (id, full_name, email, created_at)
  VALUES (jackeline_id, 'Jackeline Chonate Ventura', 'jackeline.chonate.v@gmail.com', now())
  ON CONFLICT (id) DO UPDATE SET full_name = 'Jackeline Chonate Ventura';

  -- Asignar rol admin_corp con org_id = Corp
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = jackeline_id) THEN
    UPDATE public.user_roles SET role = 'admin_corp', org_id = '00000000-0000-0000-0000-000000000001' WHERE user_id = jackeline_id;
  ELSE
    INSERT INTO public.user_roles (user_id, role, org_id) VALUES (jackeline_id, 'admin_corp', '00000000-0000-0000-0000-000000000001');
  END IF;

  RAISE NOTICE '✅ Jackeline Chonate lista con rol admin_corp';
END $$;

-- ═══════════════════════════════════════════════════════════
--  VERIFICAR que quedaron bien
-- ═══════════════════════════════════════════════════════════
SELECT
  u.id,
  u.full_name,
  u.email,
  ur.role,
  ur.negocio_id
FROM public.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email IN ('fabyarepra@gmail.com','jackeline.chonate.v@gmail.com');

-- ═══════════════════════════════════════════════════════════
--  Credenciales de acceso:
--  Fabián:    fabyarepra@gmail.com        / 123Abc!
--  Jackeline: jackeline.chonate.v@gmail.com / 123Abc!
--  → Entran en /login y van automáticamente al Corp Panel
--  → Desde el tab "Tiendas" pueden ingresar a cada tienda
--  → Pueden crear store_admin y vendedores desde ahí
-- ═══════════════════════════════════════════════════════════
