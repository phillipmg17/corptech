-- ============================================================
--  FASE 8 — Imágenes Reales de Productos
--  Agrega columna image_url a la tabla products
--  Corre esto en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columna
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Índice para búsquedas rápidas por nombre (por si acaso)
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- ══════════════════════════════════════════════════════
--  3. Imágenes Apple CDN — iPhone
-- ══════════════════════════════════════════════════════

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone16-pro-model-unselect-gallery-2-202409?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'iPhone 16 Pro Max';

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone16-pro-model-unselect-gallery-1-202409?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('iPhone 16 Pro Max 512GB','iPhone 16 Pro Max 1TB');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone16-pro-finish-select-202409-6-3inch-blacktitanium?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('iPhone 16 Pro','iPhone 16 Pro 256GB');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone16-finish-select-202409-6-7inch_GEO_US?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'iPhone 16 Plus';

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone16-finish-select-202409-6-1inch_GEO_US?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'iPhone 16';

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone15-pro-model-unselect-gallery-2-202309?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('iPhone 15 Pro Max','iPhone 15 Pro Max 1TB');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone15-pro-model-unselect-gallery-1-202309?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('iPhone 15 Pro','iPhone 15 Pro 256GB');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone15-model-unselect-gallery-2-202309?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('iPhone 15 Plus','iPhone 15','iPhone 15 256GB');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone14-pro-model-unselect-gallery-2-202209?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('iPhone 14 Pro Max','iPhone 14 Pro');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone14-model-unselect-gallery-2-202209?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('iPhone 14 Plus','iPhone 14');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone13-model-unselect-gallery-2-202109?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('iPhone 13','iPhone 13 Mini');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone13-pro-model-unselect-gallery-2-202109?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'iPhone 13 Pro';

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone12-model-unselect-gallery-2-202010?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'iPhone 12';

-- ══════════════════════════════════════════════════════
--  Mac
-- ══════════════════════════════════════════════════════

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-m3-pro-spaceblack-gallery1-202310?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('MacBook Pro 14" M3 Pro','MacBook Pro 14" M3');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-m3-max-silver-gallery1-202310?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'MacBook Pro 16" M3 Max';

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-m2-pro-space-gray-gallery1-202301?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'MacBook Pro 16" M2 Pro';

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-m3-midnight-gallery1-202402?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('MacBook Air 13" M3','MacBook Air 13" M2','MacBook Air 13" M2 16GB');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba15-m3-midnight-gallery1-202402?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'MacBook Air 15" M3';

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba13-gold-gallery1-202106?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('MacBook Air 13" M1','MacBook Air 13" M1 16GB');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-m1-pro-space-gray-gallery1-202110?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('MacBook Pro 14" M1 Pro','MacBook Pro 13" M2');

-- ══════════════════════════════════════════════════════
--  iPad
-- ══════════════════════════════════════════════════════

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-11-select-wifi-spaceb-202405?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('iPad Pro 11" M4','iPad Pro 11" M4 Cellular');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-13-select-wifi-spaceb-202405?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'iPad Pro 13" M4';

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-13-select-wifi-blue-202405?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('iPad Air 13" M2','iPad Air 13" M2 Cellular');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-11-select-wifi-blue-202405?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'iPad Air 11" M2';

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-10gen-select-wifi-blue-202210?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('iPad 10th Gen','iPad 10th Gen 256GB');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-mini-select-wifi-purple-202109?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('iPad Mini 6','iPad Mini 6 256GB WiFi');

-- ══════════════════════════════════════════════════════
--  AirPods
-- ══════════════════════════════════════════════════════

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-pro-2-hero-select-202409?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('AirPods Pro 2','AirPods Pro 2 MagSafe','AirPods Pro 2 USB-C MagSafe');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-3rd-gen-select-202109?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'AirPods 3';

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-max-select-skyblue-202409?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('AirPods Max USB-C','AirPods Max Sky Blue');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-4-select-202409?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'AirPods 4 ANC';

-- ══════════════════════════════════════════════════════
--  Apple Watch
-- ══════════════════════════════════════════════════════

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-ultra2-titanium-form-unselect-gallery-1-202309?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('Apple Watch Ultra 2','Apple Watch Ultra 2 Ocean Band');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-s10-46-alum-jetblack-nc-s10-202409?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('Apple Watch Series 10 45mm','Apple Watch Series 10 44mm','Apple Watch Series 10 GPS+Cellular');

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-se-2gen-select-202309?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name IN ('Apple Watch SE 2','Apple Watch SE 2 GPS');

-- ══════════════════════════════════════════════════════
--  Accesorios
-- ══════════════════════════════════════════════════════

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQTP3?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'Magic Mouse USB-C';

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airtag-double-select-202104?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'AirTag';

UPDATE products SET image_url = 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MHXH3?wid=800&hei=800&fmt=jpeg&qlt=90'
WHERE name = 'MagSafe Charger 1m USB-C';

-- ══════════════════════════════════════════════════════
--  Listo. Ahora cada producto tiene image_url.
--  Las imágenes se muestran en el catálogo y formulario.
--  Si alguna URL no carga → el sistema muestra el emoji como fallback.
-- ══════════════════════════════════════════════════════
