-- ══════════════════════════════════════════════════════════════
--  MIGRATION: E-Commerce V2 — Campos avanzados en tiendas_config
--  Copia y ejecuta en Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- 1. Agregar columna sale_price a stock_items si aún no existe
ALTER TABLE stock_items
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC DEFAULT 0;

-- 2. Nuevos campos en tiendas_config para el e-commerce completo
ALTER TABLE tiendas_config
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS hero_title         TEXT,
  ADD COLUMN IF NOT EXISTS hero_subtitle      TEXT,
  ADD COLUMN IF NOT EXISTS hero_cta           TEXT DEFAULT 'Ver productos',
  ADD COLUMN IF NOT EXISTS hero_image_url     TEXT,
  ADD COLUMN IF NOT EXISTS about_text         TEXT,
  ADD COLUMN IF NOT EXISTS about_image_url    TEXT,
  ADD COLUMN IF NOT EXISTS izipay_payment_url TEXT,
  ADD COLUMN IF NOT EXISTS niubiz_payment_url TEXT,
  ADD COLUMN IF NOT EXISTS bank_account       JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS faq_items          JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS testimonials       JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS shipping_info      JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS return_policy      TEXT,
  ADD COLUMN IF NOT EXISTS meta_title         TEXT,
  ADD COLUMN IF NOT EXISTS meta_description   TEXT;

-- 3. Poblar datos de ejemplo para cada tienda
--    (Usa los org_id reales de tu tabla organizations)

-- Futurteck
UPDATE tiendas_config SET
  hero_title      = 'Tecnología que transforma tu vida',
  hero_subtitle   = 'Los mejores dispositivos Apple y Android al mejor precio. Garantía oficial y envío a todo el Perú.',
  hero_cta        = 'Explorar productos',
  about_text      = 'Somos Futurteck, especialistas en tecnología premium. Llevamos años ayudando a miles de peruanos a elegir el dispositivo ideal. Todos nuestros equipos pasan por rigurosos controles de calidad.',
  faq_items       = '[
    {"q":"¿Cuánto demoran los envíos?","a":"En Lima 24-48 horas hábiles. Provincias 3-7 días. Todos con número de seguimiento."},
    {"q":"¿Los productos son originales?","a":"100% originales con caja y garantía oficial del fabricante."},
    {"q":"¿Tienen garantía?","a":"Equipos nuevos: 1 año garantía Apple. Usados: 3-6 meses garantía de tienda."},
    {"q":"¿Puedo devolver un producto?","a":"Sí, 7 días calendario desde la recepción, en las mismas condiciones."},
    {"q":"¿Qué métodos de pago aceptan?","a":"Yape, Plin, transferencia bancaria, tarjetas Visa/Mastercard vía IziPay y Niubiz."},
    {"q":"¿Tienen tienda física?","a":"Sí, escríbenos por WhatsApp para coordinar visita o recojo en tienda."}
  ]'::JSONB,
  testimonials    = '[
    {"name":"Carlos R.","stars":5,"text":"Excelente atención y productos 100% originales. Mi iPhone llegó perfecto y rapidísimo.","avatar":"CR"},
    {"name":"María G.","stars":5,"text":"Compré un MacBook Air y la experiencia fue increíble. Muy bien asesorada.","avatar":"MG"},
    {"name":"José M.","stars":5,"text":"Muy buena relación precio-calidad. Pago seguro y envío al día siguiente.","avatar":"JM"},
    {"name":"Lucía P.","stars":5,"text":"Me guiaron para elegir entre dos modelos. El equipo llegó antes de lo esperado.","avatar":"LP"}
  ]'::JSONB,
  bank_account    = '{"bank":"BCP","account":"191-12345678-0-12","cci":"00219100123456780123","name":"Futurteck SAC"}'::JSONB,
  shipping_info   = '{"lima":"24-48 horas hábiles","provincias":"3-7 días hábiles"}'::JSONB,
  return_policy   = '7 días calendario desde la recepción del producto, en las mismas condiciones en que fue entregado.',
  meta_title      = 'Futurteck — Tecnología Premium en Perú',
  meta_description= 'Compra iPhones, MacBooks, iPads y más con garantía oficial. Envíos a todo el Perú. Pago seguro.'
WHERE org_id = '00000000-0000-0000-0000-000000000002';

-- Innovatech
UPDATE tiendas_config SET
  hero_title      = 'Innovación en cada dispositivo',
  hero_subtitle   = 'Encuentra los últimos iPhones, MacBooks y accesorios Apple. Precios justos, calidad garantizada.',
  hero_cta        = 'Ver catálogo',
  about_text      = 'En Innovatech Store somos apasionados por la tecnología Apple. Llevamos años conectando a peruanos con los mejores dispositivos, con atención personalizada y garantía real.',
  faq_items       = '[
    {"q":"¿Cuánto demoran los envíos?","a":"Lima: 24-48 horas. Provincias: 3-7 días. Envío con seguimiento incluido."},
    {"q":"¿Los productos son originales?","a":"Sí, todos originales con caja y accesorios completos."},
    {"q":"¿Ofrecen garantía?","a":"1 año garantía oficial en nuevos. 3-6 meses en usados/reacondicionados."},
    {"q":"¿Puedo pagar a cuotas?","a":"Sí, con tarjeta de crédito a través de IziPay o Niubiz."},
    {"q":"¿Cómo hago el seguimiento de mi pedido?","a":"Te enviamos el código de seguimiento por WhatsApp o email."},
    {"q":"¿Tienen servicio técnico?","a":"Sí, trabajamos con técnicos certificados. Escríbenos para más información."}
  ]'::JSONB,
  testimonials    = '[
    {"name":"Andrés V.","stars":5,"text":"Pedí un iPhone 15 Pro y llegó en 24 horas. Todo perfecto, caja sellada y con garantía.","avatar":"AV"},
    {"name":"Patricia S.","stars":5,"text":"Excelente servicio. Me asesoraron muy bien para elegir el MacBook ideal.","avatar":"PS"},
    {"name":"Roberto L.","stars":5,"text":"Compré un iPad para mi hijo y quedé encantado. Precio justo y entrega rapidísima.","avatar":"RL"},
    {"name":"Ana F.","stars":5,"text":"Muy confiables. Ya es mi tercera compra y siempre la misma calidad y atención.","avatar":"AF"}
  ]'::JSONB,
  bank_account    = '{"bank":"Interbank","account":"200-123456789-0","cci":"00320012345678900123","name":"Innovatech Store SAC"}'::JSONB,
  meta_title      = 'Innovatech Store — Apple Premium Perú',
  meta_description= 'iPhones, MacBooks, iPads y accesorios Apple originales. Garantía oficial y envíos a todo el Perú.'
WHERE org_id = '00000000-0000-0000-0000-000000000003';

-- WeTech Peru
UPDATE tiendas_config SET
  hero_title      = 'Tu tienda tech de confianza',
  hero_subtitle   = 'Los mejores iPhones y tecnología Apple al alcance de todos los peruanos. Garantía y envío nacional.',
  hero_cta        = 'Comprar ahora',
  about_text      = 'WeTech Peru nació con una misión: hacer accesible la mejor tecnología para todos los peruanos. Somos expertos en Apple y te ayudamos a encontrar el dispositivo perfecto para tu estilo de vida.',
  faq_items       = '[
    {"q":"¿Cuánto demoran los envíos?","a":"Lima Metropolitana: 24 horas. Resto del país: 3-5 días hábiles con seguimiento."},
    {"q":"¿Los equipos son originales con caja?","a":"Sí, todos nuestros equipos son originales con caja y accesorios completos."},
    {"q":"¿Qué garantía ofrecen?","a":"Equipos nuevos: garantía oficial Apple 1 año. Seminuevos: garantía de tienda 90 días."},
    {"q":"¿Puedo visitar la tienda física?","a":"Sí, coordina por WhatsApp para visitarnos o recoger tu pedido."},
    {"q":"¿Aceptan cambio o devoluciones?","a":"7 días hábiles para cambios o devoluciones en las mismas condiciones."},
    {"q":"¿Tienen financiamiento?","a":"Sí, con tarjetas de crédito hasta en 12 cuotas sin intereses."}
  ]'::JSONB,
  testimonials    = '[
    {"name":"Diego M.","stars":5,"text":"Compré mi iPhone 14 aquí. Llegó al día siguiente sellado y con garantía. ¡Volvería a comprar!","avatar":"DM"},
    {"name":"Carla T.","stars":5,"text":"La atención por WhatsApp es excelente. Me respondieron al instante y me guiaron perfecto.","avatar":"CT"},
    {"name":"Martín O.","stars":5,"text":"Precios muy competitivos y producto exactamente como describieron. 100% confiable.","avatar":"MO"},
    {"name":"Valeria C.","stars":5,"text":"Mi MacBook llegó en perfectas condiciones. Súper fácil el proceso de compra.","avatar":"VC"}
  ]'::JSONB,
  bank_account    = '{"bank":"BBVA","account":"0011-0012-01-00012345","cci":"01101201000123450123","name":"WeTech Peru SAC"}'::JSONB,
  meta_title      = 'WeTech Peru — Tu tienda Apple de confianza',
  meta_description= 'iPhones, MacBooks y tecnología Apple originales en Perú. Garantía oficial, envíos rápidos y pagos seguros.'
WHERE org_id = '00000000-0000-0000-0000-000000000004';

-- 4. Verificar
SELECT org_id, store_name, hero_title, meta_title
FROM tiendas_config
WHERE org_id IN (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004'
);
