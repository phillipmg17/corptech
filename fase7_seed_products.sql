-- ============================================================
--  FASE 7 — Seed Data: Catálogo de 50 Productos  (CORREGIDO)
--  Incluye corp_id obligatorio
--  Fórmula: Costo Landed = Precio Base × 1.15 (15% margen)
--  sale_price en PEN — TC referencial 3.75
--  Corre esto en Supabase SQL Editor
-- ============================================================

-- Corp Tech ID
-- '00000000-0000-0000-0000-000000000001'

INSERT INTO products (corp_id, name, emoji, description, sale_price, category, chip, default_colors, default_capacities)
VALUES

-- ══════════════════════════════════════════════════════
--  iPhone (20 modelos)
-- ══════════════════════════════════════════════════════

('00000000-0000-0000-0000-000000000001','iPhone 16 Pro Max','📱','Base $1000 + 15% = Landed $1150 | LL/A & LZ/A',4313,'iphone','A18 Pro',
 ARRAY['Natural Titanium','Black Titanium','White Titanium','Desert Titanium'],ARRAY['256 GB','512 GB','1 TB']),

('00000000-0000-0000-0000-000000000001','iPhone 16 Pro','📱','Base $887 + 15% = Landed $1020 | LL/A & LZ/A',3825,'iphone','A18 Pro',
 ARRAY['Black Titanium','White Titanium','Natural Titanium','Desert Titanium'],ARRAY['128 GB','256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','iPhone 16 Pro Max 512GB','📱','Base $1087 + 15% = Landed $1250 | LL/A & LZ/A',4688,'iphone','A18 Pro',
 ARRAY['Natural Titanium','Black Titanium','White Titanium','Desert Titanium'],ARRAY['256 GB','512 GB','1 TB']),

('00000000-0000-0000-0000-000000000001','iPhone 16 Pro Max 1TB','📱','Base $1261 + 15% = Landed $1450 | LL/A & LZ/A',5438,'iphone','A18 Pro',
 ARRAY['Natural Titanium','Black Titanium','White Titanium','Desert Titanium'],ARRAY['256 GB','512 GB','1 TB']),

('00000000-0000-0000-0000-000000000001','iPhone 16 Plus','📱','Base $713 + 15% = Landed $820 | LL/A & LZ/A',3075,'iphone','A18',
 ARRAY['Black','White','Pink','Teal','Ultramarine'],ARRAY['128 GB','256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','iPhone 16','📱','Base $652 + 15% = Landed $750 | LL/A & LZ/A',2813,'iphone','A18',
 ARRAY['Black','White','Pink','Teal','Ultramarine'],ARRAY['128 GB','256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','iPhone 15 Pro Max','📱','Base $852 + 15% = Landed $980 | LL/A & LZ/A',3675,'iphone','A17 Pro',
 ARRAY['Blue Titanium','Black Titanium','Natural Titanium','White Titanium'],ARRAY['256 GB','512 GB','1 TB']),

('00000000-0000-0000-0000-000000000001','iPhone 15 Pro Max 1TB','📱','Base $1000 + 15% = Landed $1150 | LL/A & LZ/A',4313,'iphone','A17 Pro',
 ARRAY['Blue Titanium','Black Titanium','Natural Titanium','White Titanium'],ARRAY['256 GB','512 GB','1 TB']),

('00000000-0000-0000-0000-000000000001','iPhone 15 Pro','📱','Base $783 + 15% = Landed $900 | LL/A & LZ/A',3375,'iphone','A17 Pro',
 ARRAY['Black Titanium','Natural Titanium','Blue Titanium','White Titanium'],ARRAY['128 GB','256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','iPhone 15 Pro 256GB','📱','Base $826 + 15% = Landed $950 | LL/A & LZ/A',3563,'iphone','A17 Pro',
 ARRAY['Black Titanium','Natural Titanium','Blue Titanium','White Titanium'],ARRAY['128 GB','256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','iPhone 15 Plus','📱','Base $678 + 15% = Landed $780 | LL/A & LZ/A',2925,'iphone','A16 Bionic',
 ARRAY['Black','Blue','Green','Yellow','Pink'],ARRAY['128 GB','256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','iPhone 15','📱','Base $626 + 15% = Landed $720 | LL/A & LZ/A',2700,'iphone','A16 Bionic',
 ARRAY['Black','Blue','Green','Yellow','Pink'],ARRAY['128 GB','256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','iPhone 14 Pro Max','📱','Base $713 + 15% = Landed $820 | LL/A & LZ/A',3075,'iphone','A16 Bionic',
 ARRAY['Space Black','Silver','Gold','Deep Purple'],ARRAY['128 GB','256 GB','512 GB','1 TB']),

('00000000-0000-0000-0000-000000000001','iPhone 14 Pro','📱','Base $652 + 15% = Landed $750 | LL/A & LZ/A',2813,'iphone','A16 Bionic',
 ARRAY['Space Black','Silver','Gold','Deep Purple'],ARRAY['128 GB','256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','iPhone 14 Plus','📱','Base $591 + 15% = Landed $680 | LL/A & LZ/A',2550,'iphone','A15 Bionic',
 ARRAY['Midnight','Purple','Yellow','Blue','Red'],ARRAY['128 GB','256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','iPhone 14','📱','Base $443 + 15% = Landed $510 | Semi-nuevo | LL/A',1913,'iphone','A15 Bionic',
 ARRAY['Midnight','Purple','Yellow','Blue','Red'],ARRAY['128 GB','256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','iPhone 13','📱','Base $391 + 15% = Landed $450 | LL/A & LZ/A',1688,'iphone','A15 Bionic',
 ARRAY['Midnight','Starlight','Blue','Pink','Green','Red'],ARRAY['128 GB','256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','iPhone 13 Pro','📱','Base $504 + 15% = Landed $580 | LL/A & LZ/A',2175,'iphone','A15 Bionic',
 ARRAY['Graphite','Gold','Silver','Sierra Blue','Alpine Green'],ARRAY['128 GB','256 GB','512 GB','1 TB']),

('00000000-0000-0000-0000-000000000001','iPhone 13 Mini','📱','Base $348 + 15% = Landed $400 | LL/A & LZ/A',1500,'iphone','A15 Bionic',
 ARRAY['Midnight','Starlight','Blue','Pink','Green','Red'],ARRAY['128 GB','256 GB']),

('00000000-0000-0000-0000-000000000001','iPhone 12','📱','Base $330 + 15% = Landed $380 | LL/A & LZ/A',1425,'iphone','A14 Bionic',
 ARRAY['Black','White','Blue','Green','Purple','Red'],ARRAY['64 GB','128 GB','256 GB']),

-- ══════════════════════════════════════════════════════
--  Mac (12 modelos)
-- ══════════════════════════════════════════════════════

('00000000-0000-0000-0000-000000000001','MacBook Pro 14" M3 Pro','💻','Base $1609 + 15% = Landed $1850 | 18GB RAM | 512GB SSD',6938,'mac','M3 Pro',
 ARRAY['Space Black','Silver'],ARRAY['512 GB','1 TB']),

('00000000-0000-0000-0000-000000000001','MacBook Air 13" M2','💻','Base $800 + 15% = Landed $920 | 8GB RAM | 256GB SSD',3450,'mac','M2',
 ARRAY['Midnight','Starlight','Silver','Space Gray'],ARRAY['256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','MacBook Pro 16" M3 Max','💻','Base $2696 + 15% = Landed $3100 | 36GB RAM | 1TB SSD',11625,'mac','M3 Max',
 ARRAY['Silver','Space Black'],ARRAY['1 TB','2 TB']),

('00000000-0000-0000-0000-000000000001','MacBook Air 15" M3','💻','Base $1261 + 15% = Landed $1450 | 16GB RAM | 512GB SSD',5438,'mac','M3',
 ARRAY['Midnight','Starlight','Silver','Space Gray'],ARRAY['256 GB','512 GB','1 TB']),

('00000000-0000-0000-0000-000000000001','MacBook Pro 14" M3','💻','Base $1357 + 15% = Landed $1560 | 8GB RAM | 512GB SSD',5850,'mac','M3',
 ARRAY['Silver','Space Black'],ARRAY['512 GB','1 TB']),

('00000000-0000-0000-0000-000000000001','MacBook Air 13" M3','💻','Base $826 + 15% = Landed $950 | 8GB RAM | 256GB SSD',3563,'mac','M3',
 ARRAY['Midnight','Starlight','Silver','Space Gray'],ARRAY['256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','MacBook Pro 16" M2 Pro','💻','Base $1913 + 15% = Landed $2200 | 16GB RAM | 512GB SSD',8250,'mac','M2 Pro',
 ARRAY['Space Gray','Silver'],ARRAY['512 GB','1 TB']),

('00000000-0000-0000-0000-000000000001','MacBook Air 13" M1','💻','Base $652 + 15% = Landed $750 | 8GB RAM | 256GB SSD',2813,'mac','M1',
 ARRAY['Space Gray','Silver','Gold'],ARRAY['256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','MacBook Pro 14" M1 Pro','💻','Base $1435 + 15% = Landed $1650 | 16GB RAM | 512GB SSD',6188,'mac','M1 Pro',
 ARRAY['Space Gray','Silver'],ARRAY['512 GB','1 TB']),

('00000000-0000-0000-0000-000000000001','MacBook Air 13" M2 16GB','💻','Base $957 + 15% = Landed $1100 | 16GB RAM | 512GB SSD',4125,'mac','M2',
 ARRAY['Midnight','Starlight','Silver','Space Gray'],ARRAY['256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','MacBook Pro 13" M2','💻','Base $957 + 15% = Landed $1100 | 8GB RAM | 256GB SSD',4125,'mac','M2',
 ARRAY['Space Gray','Silver'],ARRAY['256 GB','512 GB','1 TB']),

('00000000-0000-0000-0000-000000000001','MacBook Air 13" M1 16GB','💻','Base $826 + 15% = Landed $950 | 16GB RAM | 512GB SSD',3563,'mac','M1',
 ARRAY['Space Gray','Silver','Gold'],ARRAY['256 GB','512 GB']),

-- ══════════════════════════════════════════════════════
--  iPad (10 modelos)
-- ══════════════════════════════════════════════════════

('00000000-0000-0000-0000-000000000001','iPad Pro 11" M4','🍎','Base $791 + 15% = Landed $910 | WiFi',3413,'ipad','M4',
 ARRAY['Space Black','Silver'],ARRAY['256 GB','512 GB','1 TB','2 TB']),

('00000000-0000-0000-0000-000000000001','iPad Air 13" M2','🍎','Base $643 + 15% = Landed $740 | WiFi',2775,'ipad','M2',
 ARRAY['Blue','Purple','Starlight','Space Gray'],ARRAY['128 GB','256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','iPad 10th Gen','🍎','Base $339 + 15% = Landed $390 | WiFi',1463,'ipad','A14 Bionic',
 ARRAY['Blue','Pink','Yellow','Silver'],ARRAY['64 GB','256 GB']),

('00000000-0000-0000-0000-000000000001','iPad Mini 6','🍎','Base $504 + 15% = Landed $580 | WiFi+Cellular',2175,'ipad','A15 Bionic',
 ARRAY['Purple','Starlight','Pink','Space Gray'],ARRAY['64 GB','256 GB']),

('00000000-0000-0000-0000-000000000001','iPad Pro 13" M4','🍎','Base $957 + 15% = Landed $1100 | WiFi',4125,'ipad','M4',
 ARRAY['Space Black','Silver'],ARRAY['256 GB','512 GB','1 TB','2 TB']),

('00000000-0000-0000-0000-000000000001','iPad Air 11" M2','🍎','Base $591 + 15% = Landed $680 | WiFi',2550,'ipad','M2',
 ARRAY['Blue','Purple','Starlight','Space Gray'],ARRAY['128 GB','256 GB','512 GB']),

('00000000-0000-0000-0000-000000000001','iPad 10th Gen 256GB','🍎','Base $391 + 15% = Landed $450 | WiFi',1688,'ipad','A14 Bionic',
 ARRAY['Blue','Pink','Yellow','Silver'],ARRAY['64 GB','256 GB']),

('00000000-0000-0000-0000-000000000001','iPad Mini 6 256GB WiFi','🍎','Base $452 + 15% = Landed $520 | WiFi',1950,'ipad','A15 Bionic',
 ARRAY['Purple','Starlight','Pink','Space Gray'],ARRAY['64 GB','256 GB']),

('00000000-0000-0000-0000-000000000001','iPad Pro 11" M4 Cellular','🍎','Base $1000 + 15% = Landed $1150 | WiFi+Cellular',4313,'ipad','M4',
 ARRAY['Space Black','Silver'],ARRAY['256 GB','512 GB','1 TB','2 TB']),

('00000000-0000-0000-0000-000000000001','iPad Air 13" M2 Cellular','🍎','Base $774 + 15% = Landed $890 | WiFi+Cellular',3338,'ipad','M2',
 ARRAY['Blue','Purple','Starlight','Space Gray'],ARRAY['128 GB','256 GB','512 GB']),

-- ══════════════════════════════════════════════════════
--  AirPods (5 modelos)
-- ══════════════════════════════════════════════════════

('00000000-0000-0000-0000-000000000001','AirPods Pro 2','🎧','Base $243 + 15% = Landed $280 | Chip H2 | ANC',1050,'airpods','H2',
 ARRAY['White'],ARRAY['Unidad']),

('00000000-0000-0000-0000-000000000001','AirPods 3','🎧','Base $157 + 15% = Landed $180 | Chip H1 | Spatial Audio',675,'airpods','H1',
 ARRAY['White'],ARRAY['Unidad']),

('00000000-0000-0000-0000-000000000001','AirPods Max USB-C','🎧','Base $478 + 15% = Landed $550 | Chip H1 | Over-ear ANC',2063,'airpods','H1',
 ARRAY['Midnight','Blue','Purple','Starlight','Orange'],ARRAY['Unidad']),

('00000000-0000-0000-0000-000000000001','AirPods Pro 2 MagSafe','🎧','Base $252 + 15% = Landed $290 | Chip H2 | MagSafe Case',1088,'airpods','H2',
 ARRAY['White'],ARRAY['Unidad']),

('00000000-0000-0000-0000-000000000001','AirPods 4 ANC','🎧','Base $174 + 15% = Landed $200 | Chip H2 | Open-ear ANC',750,'airpods','H2',
 ARRAY['White'],ARRAY['Unidad']),

-- ══════════════════════════════════════════════════════
--  Apple Watch (3 modelos)
-- ══════════════════════════════════════════════════════

('00000000-0000-0000-0000-000000000001','Apple Watch Series 10 45mm','⌚','Base $365 + 15% = Landed $420 | GPS | S10 SiP',1575,'accesorio','S10 SiP',
 ARRAY['Jet Black','Rose Gold','Silver','Natural Aluminum'],ARRAY['41 mm','45 mm']),

('00000000-0000-0000-0000-000000000001','Apple Watch Ultra 2','⌚','Base $687 + 15% = Landed $790 | GPS+Cellular | S9 SiP',2963,'accesorio','S9 SiP',
 ARRAY['Natural Titanium','Black Titanium'],ARRAY['49 mm']),

('00000000-0000-0000-0000-000000000001','Apple Watch SE 2','⌚','Base $243 + 15% = Landed $280 | GPS | S8 SiP',1050,'accesorio','S8 SiP',
 ARRAY['Midnight','Starlight','Silver'],ARRAY['40 mm','44 mm']);

-- ══════════════════════════════════════════════════════
--  50 productos insertados correctamente
--  iPhone:20 | Mac:12 | iPad:10 | AirPods:5 | Watch:3
-- ══════════════════════════════════════════════════════
