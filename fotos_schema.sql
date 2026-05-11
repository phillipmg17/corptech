-- ============================================================
-- CORP TECH ERP — MÓDULO REGISTRO FOTOGRÁFICO OBLIGATORIO
-- INSTRUCCIONES: Pega en Supabase → SQL Editor → Run
-- ============================================================

-- 1. CREAR BUCKET DE STORAGE (corp-media)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'corp-media',
  'corp-media',
  true,
  10485760, -- 10 MB máximo por foto
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS DE STORAGE
-- Usuarios autenticados pueden subir fotos
CREATE POLICY "auth_users_can_upload_photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'corp-media');

-- Cualquiera puede ver las fotos (miniaturas en paneles)
CREATE POLICY "public_can_view_photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'corp-media');

-- Usuarios autenticados pueden actualizar sus propias fotos
CREATE POLICY "auth_users_can_update_photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'corp-media');

-- 3. TABLA UNIVERSAL DE ADJUNTOS FOTOGRÁFICOS
-- Une fotos a cualquier entidad del sistema (transferencia, venta, pago, entrega...)
CREATE TABLE IF NOT EXISTS public.media_attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   TEXT NOT NULL,          -- 'transfer','sale','delivery','payment','accounting','checkin','checkout'
  entity_id     UUID NOT NULL,
  photo_url     TEXT NOT NULL,          -- URL pública en Supabase Storage
  storage_path  TEXT,                   -- ruta interna en el bucket (para borrar si se necesita)
  photo_type    TEXT NOT NULL,          -- 'checkin','checkout','receipt','delivery','product','voucher'
  caption       TEXT,                   -- descripción opcional
  uploaded_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  org_id        UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsqueda rápida por entidad
CREATE INDEX IF NOT EXISTS idx_media_entity ON public.media_attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_media_org    ON public.media_attachments(org_id);

-- RLS: usuarios ven fotos de su propia org; Corp ve todo
ALTER TABLE public.media_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_select" ON public.media_attachments FOR SELECT
USING (org_id = get_my_org_id() OR is_corp_user());

CREATE POLICY "media_insert" ON public.media_attachments FOR INSERT
WITH CHECK (org_id = get_my_org_id() OR is_corp_user());

-- 4. AGREGAR COLUMNAS FOTO A TABLAS EXISTENTES
-- (una columna de foto principal por registro + pueden tener múltiples vía media_attachments)

-- stock_transfers: foto al entrar de USA (checkin) y al salir (checkout)
ALTER TABLE public.stock_transfers
  ADD COLUMN IF NOT EXISTS checkin_photo_url  TEXT,
  ADD COLUMN IF NOT EXISTS checkout_photo_url TEXT;

-- deliveries: foto del receptor o del cargo firmado
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT;

-- business_payments: ya tiene receipt_url, agregamos alias más claro
ALTER TABLE public.business_payments
  ADD COLUMN IF NOT EXISTS receipt_photo_url TEXT;

-- accounting_tx: comprobante contable
ALTER TABLE public.accounting_tx
  ADD COLUMN IF NOT EXISTS receipt_photo_url TEXT;

-- sales: foto de la venta (opcional, para auditoría)
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS sale_photo_url TEXT;

-- 5. REGISTRAR EN FEATURE REGISTRY
INSERT INTO public.feature_registry
  (code, name, panel, description, status, built_at)
VALUES
  ('MEDIA-001', 'Storage Bucket corp-media',        'Infraestructura', 'Bucket Supabase Storage para fotos del sistema ERP',                    'done', NOW()),
  ('MEDIA-002', 'Tabla media_attachments',           'Base de Datos',   'Tabla universal de adjuntos fotográficos con RLS multi-tenant',         'done', NOW()),
  ('MEDIA-003', 'Check-in fotográfico de productos', 'Corp Admin',      'Captura de foto al registrar llegada de productos desde USA',           'done', NOW()),
  ('MEDIA-004', 'Check-out fotográfico de envíos',   'Corp Admin',      'Captura de foto al preparar paquetes para despacho a tiendas',         'done', NOW()),
  ('MEDIA-005', 'Foto de entrega con receptor',      'Corp Admin',      'Foto del receptor o cargo firmado en confirmación de entrega',         'done', NOW()),
  ('MEDIA-006', 'Voucher fotográfico de pagos',      'Corp Admin',      'Captura de voucher/comprobante asociado a cada pago o transferencia',  'done', NOW()),
  ('MEDIA-007', 'Visor de miniaturas en historial',  'Corp Admin',      'Thumbnails clickeables en listas de transferencias, pagos y entregas', 'done', NOW())
ON CONFLICT (code) DO NOTHING;

-- Verificar resultados
SELECT 'BUCKET' as tipo, id as nombre FROM storage.buckets WHERE id = 'corp-media'
UNION ALL
SELECT 'TABLA', tablename FROM pg_tables WHERE tablename = 'media_attachments' AND schemaname = 'public'
UNION ALL
SELECT 'COLUMNA checkin_photo', column_name FROM information_schema.columns WHERE table_name = 'stock_transfers' AND column_name = 'checkin_photo_url'
UNION ALL
SELECT 'COLUMNA checkout_photo', column_name FROM information_schema.columns WHERE table_name = 'stock_transfers' AND column_name = 'checkout_photo_url'
UNION ALL
SELECT 'COLUMNA delivery_photo', column_name FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'delivery_photo_url';
