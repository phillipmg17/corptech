-- ============================================================
-- CORP TECH ERP — REGISTRO DE FUNCIONES: PANEL TIENDA
-- INSTRUCCIONES: Pega en Supabase → SQL Editor → Run
-- ============================================================

INSERT INTO public.feature_registry (code, name, panel, description, status, built_at)
VALUES
  ('STORE-001', 'Login por tienda con detección de org',       'Panel Tienda', 'Auth Supabase con validación de org type=store. Cada tienda accede con su propio usuario. Color de acento dinámico por tienda.',                          'done', NOW()),
  ('STORE-002', 'Dashboard de tienda con KPIs diarios',        'Panel Tienda', 'Panel de inicio con ventas del día, stock disponible, clientes, deuda con Corp. Alerta de stock bajo y ventas recientes.',                                    'done', NOW()),
  ('STORE-003', 'Punto de Venta (POS) completo',               'Panel Tienda', 'Búsqueda de productos por nombre/IMEI, carrito con qty, descuentos, selección de cliente, método de pago, foto de venta opcional.',                           'done', NOW()),
  ('STORE-004', 'Autorización biométrica de descuentos >10%',  'Panel Tienda', 'WebAuthn FaceID/huella requerida para aplicar descuentos superiores al 10%. Fallback a PIN de 4 dígitos.',                                                     'done', NOW()),
  ('STORE-005', 'Gestión de clientes con crédito',             'Panel Tienda', 'Lista privada por tienda. Registro de nombre, DNI, teléfono, email, límite de crédito, deuda usada. Barra de crédito visual.',                                 'done', NOW()),
  ('STORE-006', 'Inventario de tienda con filtro y estado',    'Panel Tienda', 'Vista de stock_items propios con estado available/sold/reserved, IMEI, precios, resumen por estado.',                                                          'done', NOW()),
  ('STORE-007', 'Gestión de Caja (apertura y cierre)',         'Panel Tienda', 'Apertura con monto inicial + biometría. Cierre con conteo de efectivo, foto de arqueo, notas. Resumen en tiempo real por método de pago.',                    'done', NOW()),
  ('STORE-008', 'Panel de Finanzas: deuda y pagos a Corp',     'Panel Tienda', 'Visualización de deuda actual con Corp Tech. Registro de pagos con voucher fotográfico obligatorio. Estado pending/approved/rejected.',                       'done', NOW()),
  ('STORE-009', 'Chat interno con Corp Tech',                  'Panel Tienda', 'Canales de chat en tiempo real (Supabase Realtime). Mensajes propios en azul, ajenos en gris. Badge de mensajes no leídos.',                                   'done', NOW()),
  ('STORE-010', 'Historial de ventas con filtro de período',   'Panel Tienda', 'Vista de ventas por hoy/semana/mes con cliente, productos, total, método de pago, descuento aplicado y foto adjunta.',                                         'done', NOW()),
  ('STORE-011', 'Foto obligatoria en vouchers de pago',        'Panel Tienda', 'Al registrar un pago a Corp, se requiere captura fotográfica del comprobante antes de guardar. Integrado con media_attachments.',                             'done', NOW()),
  ('STORE-012', 'UI adaptativa por tienda (colores dinámicos)','Panel Tienda', 'El panel detecta la tienda del usuario y aplica el color de acento correspondiente: azul (Futurteck), verde (Innovatech), naranja (WeTech Peru).',            'done', NOW())
ON CONFLICT (code) DO NOTHING;

-- Verificar
SELECT code, name, panel, status FROM public.feature_registry
WHERE code LIKE 'STORE-%' ORDER BY code;
