-- ══════════════════════════════════════════════════════════════
--  MIGRATION: E-Commerce V2 — Campos avanzados por tienda
--  Copia y ejecuta en Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════

-- 1. Nuevos campos en la tabla stores
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS youtube            text,
  ADD COLUMN IF NOT EXISTS phone              text,
  ADD COLUMN IF NOT EXISTS hero_title         text,
  ADD COLUMN IF NOT EXISTS hero_subtitle      text,
  ADD COLUMN IF NOT EXISTS hero_cta           text DEFAULT 'Ver productos',
  ADD COLUMN IF NOT EXISTS hero_image_url     text,
  ADD COLUMN IF NOT EXISTS about_text         text,
  ADD COLUMN IF NOT EXISTS about_image_url    text,
  ADD COLUMN IF NOT EXISTS izipay_payment_url text,
  ADD COLUMN IF NOT EXISTS niubiz_payment_url text,
  ADD COLUMN IF NOT EXISTS bank_account       jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS faq_items          jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS testimonials       jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS shipping_info      jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS return_policy      text,
  ADD COLUMN IF NOT EXISTS meta_title         text,
  ADD COLUMN IF NOT EXISTS meta_description   text,
  ADD COLUMN IF NOT EXISTS privacy_policy     text,
  ADD COLUMN IF NOT EXISTS terms_conditions   text;

-- 2. Insertar datos de ejemplo para cada tienda
-- Ajusta los org_id con los valores reales de tu base de datos

-- Futurteck (org_id: 00000000-0000-0000-0000-000000000002)
UPDATE stores SET
  hero_title      = 'Tecnología que transforma tu vida',
  hero_subtitle   = 'Los mejores dispositivos Apple y Android al mejor precio. Garantía oficial y envío a todo el Perú.',
  hero_cta        = 'Explorar productos',
  about_text      = 'Somos Futurteck, especialistas en tecnología premium. Desde nuestros inicios hemos ayudado a miles de peruanos a elegir el dispositivo ideal para su vida y trabajo. Todos nuestros equipos pasan por rigurosos controles de calidad.',
  faq_items       = '[
    {"q":"¿Cuánto demoran los envíos?","a":"En Lima 24-48 horas hábiles. Provincias 3-7 días. Todos con número de seguimiento."},
    {"q":"¿Los productos son originales?","a":"100% originales con caja y garantía oficial del fabricante."},
    {"q":"¿Tienen garantía?","a":"Equipos nuevos: 1 año garantía Apple/fabricante. Usados: 3-6 meses garantía de tienda."},
    {"q":"¿Puedo devolver un producto?","a":"Sí, 7 días calendario desde la recepción, en las mismas condiciones."},
    {"q":"¿Qué métodos de pago aceptan?","a":"Yape, Plin, transferencia bancaria, tarjetas Visa/Mastercard vía IziPay y Niubiz."},
    {"q":"¿Tienen tienda física?","a":"Sí, escríbenos por WhatsApp para coordinar visita o recojo en tienda."}
  ]'::jsonb,
  testimonials    = '[
    {"name":"Carlos R.","stars":5,"text":"Excelente atención y productos 100% originales. Mi iPhone llegó perfecto y rapidísimo.","avatar":"CR"},
    {"name":"María G.","stars":5,"text":"Compré un MacBook Air y la experiencia fue increíble. Muy bien asesorada antes de comprar.","avatar":"MG"},
    {"name":"José M.","stars":5,"text":"Muy buena relación precio-calidad. Pago seguro y envío al día siguiente. 100% recomendado.","avatar":"JM"},
    {"name":"Lucía P.","stars":5,"text":"Me guiaron para elegir entre dos modelos. El equipo llegó antes de lo esperado.","avatar":"LP"}
  ]'::jsonb,
  bank_account    = '{"bank":"BCP","account":"191-12345678-0-12","cci":"00219100123456780123","name":"Futurteck SAC"}'::jsonb,
  shipping_info   = '{"lima":"24-48 horas hábiles","provincias":"3-7 días hábiles","gratis_desde":500}'::jsonb,
  return_policy   = '7 días calendario desde la recepción del producto, en las mismas condiciones en que fue entregado.',
  meta_title      = 'Futurteck — Tecnología Premium en Perú',
  meta_description= 'Compra iPhones, MacBooks, iPads y más con garantía oficial. Envíos a todo el Perú. Pago seguro.'
WHERE org_id = '00000000-0000-0000-0000-000000000002';

-- Innovatech (org_id: 00000000-0000-0000-0000-000000000003)
UPDATE stores SET
  hero_title      = 'Innovación en cada dispositivo',
  hero_subtitle   = 'Encuentra los últimos iPhones, MacBooks y accesorios Apple. Precios justos, calidad garantizada.',
  hero_cta        = 'Ver catálogo',
  about_text      = 'En Innovatech Store somos apasionados por la tecnología Apple. Llevamos años conectando a peruanos con los mejores dispositivos del mercado, con atención personalizada y garantía real en cada compra.',
  faq_items       = '[
    {"q":"¿Cuánto demoran los envíos?","a":"Lima: 24-48 horas. Provincias: 3-7 días. Envío con seguimiento incluido."},
    {"q":"¿Los productos son originales?","a":"Sí, todos originales con caja y accesorios completos."},
    {"q":"¿Ofrecen garantía?","a":"1 año garantía oficial en nuevos. 3-6 meses en usados/reacondicionados."},
    {"q":"¿Puedo pagar a cuotas?","a":"Sí, con tarjeta de crédito a través de IziPay o Niubiz puedes pagar en cuotas."},
    {"q":"¿Cómo hago el seguimiento de mi pedido?","a":"Te enviamos el código de seguimiento por WhatsApp o email una vez despachado."},
    {"q":"¿Tienen servicio técnico?","a":"Trabajamos con técnicos certificados. Escríbenos para más información."}
  ]'::jsonb,
  testimonials    = '[
    {"name":"Andrés V.","stars":5,"text":"Pedí un iPhone 15 Pro y llegó en 24 horas. Todo perfecto, caja sellada y con garantía.","avatar":"AV"},
    {"name":"Patricia S.","stars":5,"text":"Excelente servicio. Me asesoraron muy bien para elegir el MacBook ideal para mi trabajo.","avatar":"PS"},
    {"name":"Roberto L.","stars":5,"text":"Compré un iPad para mi hijo y quedé encantado. Precio justo y entrega rapidísima.","avatar":"RL"},
    {"name":"Ana F.","stars":5,"text":"Muy confiables. Ya es mi tercera compra y siempre la misma calidad y atención.","avatar":"AF"}
  ]'::jsonb,
  bank_account    = '{"bank":"Interbank","account":"200-123456789-0","cci":"00320012345678900123","name":"Innovatech Store SAC"}'::jsonb,
  meta_title      = 'Innovatech Store — Apple Premium Perú',
  meta_description= 'iPhones, MacBooks, iPads y accesorios Apple originales. Garantía oficial y envíos a todo el Perú.'
WHERE org_id = '00000000-0000-0000-0000-000000000003';

-- WeTech Peru (org_id: 00000000-0000-0000-0000-000000000004)
UPDATE stores SET
  hero_title      = 'Tu tienda tech de confianza',
  hero_subtitle   = 'Los mejores iPhones y tecnología Apple al alcance de todos los peruanos. Garantía y envío nacional.',
  hero_cta        = 'Comprar ahora',
  about_text      = 'WeTech Peru nació con una misión: hacer accesible la mejor tecnología para todos los peruanos. Somos expertos en Apple y te ayudamos a encontrar el dispositivo perfecto para tu estilo de vida y presupuesto.',
  faq_items       = '[
    {"q":"¿Cuánto demoran los envíos?","a":"Lima Metropolitana: 24 horas. Resto del país: 3-5 días hábiles con seguimiento."},
    {"q":"¿Los equipos son originales con caja?","a":"Sí, todos nuestros equipos son originales, vienen con caja y accesorios completos."},
    {"q":"¿Qué garantía ofrecen?","a":"Equipos nuevos: garantía oficial Apple 1 año. Seminuevos: garantía de tienda 90 días."},
    {"q":"¿Puedo visitar la tienda física?","a":"Sí, coordina por WhatsApp para visitarnos o recoger tu pedido en tienda."},
    {"q":"¿Aceptan cambio o devoluciones?","a":"7 días hábiles para cambios o devoluciones, producto en las mismas condiciones."},
    {"q":"¿Tienen financiamiento?","a":"Sí, con tarjetas de crédito puedes pagar hasta en 12 cuotas sin intereses."}
  ]'::jsonb,
  testimonials    = '[
    {"name":"Diego M.","stars":5,"text":"Compré mi iPhone 14 aquí y quedé feliz. Llegó al día siguiente sellado y con garantía. ¡Volvería a comprar!","avatar":"DM"},
    {"name":"Carla T.","stars":5,"text":"La atención por WhatsApp es excelente. Me respondieron al instante y me guiaron perfecto.","avatar":"CT"},
    {"name":"Martín O.","stars":5,"text":"Precios muy competitivos y producto exactamente como describieron. 100% confiable.","avatar":"MO"},
    {"name":"Valeria C.","stars":5,"text":"Mi MacBook llegó en perfectas condiciones. Súper fácil el proceso de compra.","avatar":"VC"}
  ]'::jsonb,
  bank_account    = '{"bank":"BBVA","account":"0011-0012-01-00012345","cci":"01101201000123450123","name":"WeTech Peru SAC"}'::jsonb,
  meta_title      = 'WeTech Peru — Tu tienda Apple de confianza',
  meta_description= 'iPhones, MacBooks y tecnología Apple originales en Perú. Garantía oficial, envíos rápidos y pagos seguros.'
WHERE org_id = '00000000-0000-0000-0000-000000000004';

-- 3. Columna phone en stores (teléfono visible en footer/contacto)
-- Ya incluida arriba, solo por si acaso:
-- ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone text;

-- 4. Confirmar cambios
SELECT org_id, store_name, hero_title, meta_title FROM stores;
