-- ============================================================
-- CORP TECH ERP — REGISTRO DE FUNCIONES: POS IPHONE
-- INSTRUCCIONES: Pega en Supabase → SQL Editor → Run
-- ============================================================

INSERT INTO public.feature_registry (code, name, panel, description, status, built_at)
VALUES
  ('POS-003', 'POS iPhone dedicado (pos.html)',          'Punto de Venta', 'Archivo independiente optimizado para iPhone. Login multi-tenant con detección de org y color dinámico. Verificación de caja abierta antes de vender.',                       'done', NOW()),
  ('POS-004', 'Carrito táctil con IMEI único',           'Punto de Venta', 'Agregar productos al carrito. Cada ítem IMEI es único (qty=1). Botón eliminar. FAB flotante con badge de cantidad. Bottom sheet responsive.',                                   'done', NOW()),
  ('POS-005', 'Búsqueda y filtro por categoría',         'Punto de Venta', 'Barra de búsqueda por nombre o IMEI en tiempo real. Pills de categoría: Celulares, Tablets, Laptops, Accesorios, Otros. Grid de productos con estado visual.',                 'done', NOW()),
  ('POS-006', 'Scanner manual + cámara IMEI',            'Punto de Venta', 'Modal de escaneo con acceso a cámara trasera (getUserMedia). Fallback manual: ingresa IMEI/código y busca. Resultado múltiple filtra en grid principal.',                       'done', NOW()),
  ('POS-007', 'Descuento con biometría >10%',            'Punto de Venta', 'Campo de descuento en porcentaje. Si supera 10%, solicita WebAuthn (FaceID/huella). Fallback a PIN de 4 dígitos. Muestra ícono candado mientras espera autorización.',          'done', NOW()),
  ('POS-008', 'Selector de cliente por tienda',          'Punto de Venta', 'Sheet de clientes privada por tienda (filtrada por org_id). Búsqueda por nombre/DNI/teléfono. Opción "Sin cliente (público)". Actualiza selector en carrito.',                  'done', NOW()),
  ('POS-009', 'Métodos de pago: efectivo/tarjeta/transferencia/crédito', 'Punto de Venta', 'Grid de 4 métodos. Efectivo muestra campo de monto recibido y calcula vuelto automático. Todos registran en sale.payment_method.',                             'done', NOW()),
  ('POS-010', 'Foto de evidencia de venta',              'Punto de Venta', 'Captura de foto opcional (input capture=environment para iOS native camera). Preview antes de confirmar. Sube a bucket corp-media y registra en media_attachments.',           'done', NOW()),
  ('POS-011', 'Confirmación y escritura en Supabase',    'Punto de Venta', 'Crea registro en sales, sale_items, actualiza stock_items a sold, sube foto si existe. Transaccional con manejo de errores.',                                                  'done', NOW()),
  ('POS-012', 'Recibo de venta con compartir',           'Punto de Venta', 'Pantalla de éxito con animación. Muestra ticket ID, cliente, método, items, descuento, total. Botón compartir (Web Share API) y botón Nueva Venta.',                            'done', NOW()),
  ('POS-013', 'Ventas del día en tiempo real',           'Punto de Venta', 'Tab "Ventas" muestra historial de hoy con total acumulado. Info de caja: monto inicial, hora apertura, cantidad y monto total vendido.',                                        'done', NOW())
ON CONFLICT (code) DO NOTHING;

-- Verificar
SELECT code, name, panel, status FROM public.feature_registry
WHERE code LIKE 'POS-%' ORDER BY code;
