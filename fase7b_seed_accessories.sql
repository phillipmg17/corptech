-- ============================================================
--  FASE 7B — Seed Data: Apple Watch & Accesorios (17 items) CORREGIDO
--  Incluye corp_id obligatorio
--  Fórmula: Costo Landed = Precio Base × 1.15
--  sale_price en PEN — TC referencial 3.75
--  Corre esto en Supabase SQL Editor
-- ============================================================

INSERT INTO products (corp_id, name, emoji, description, sale_price, category, chip, default_colors, default_capacities)
VALUES

-- Apple Watch (4 modelos)
('00000000-0000-0000-0000-000000000001','Apple Watch Ultra 2 Ocean Band','⌚','Base $661 + 15% = Landed $760 | Titanio | Ocean Band Blue | GPS+Cellular | S9 SiP',2850,'accesorio','S9 SiP',
 ARRAY['Natural Titanium','Black Titanium'],ARRAY['49 mm']),

('00000000-0000-0000-0000-000000000001','Apple Watch Series 10 44mm','⌚','Base $357 + 15% = Landed $410 | GPS | S10 SiP | Jet Black',1537,'accesorio','S10 SiP',
 ARRAY['Jet Black','Rose Gold','Silver','Natural Aluminum'],ARRAY['42 mm','46 mm']),

('00000000-0000-0000-0000-000000000001','Apple Watch Series 10 GPS+Cellular','⌚','Base $443 + 15% = Landed $510 | GPS+Cellular | S10 SiP',1912,'accesorio','S10 SiP',
 ARRAY['Jet Black','Rose Gold','Silver','Natural Aluminum'],ARRAY['42 mm','46 mm']),

('00000000-0000-0000-0000-000000000001','Apple Watch SE 2 GPS','⌚','Base $243 + 15% = Landed $280 | GPS | S8 SiP',1050,'accesorio','S8 SiP',
 ARRAY['Midnight','Starlight','Silver'],ARRAY['40 mm','44 mm']),

-- AirPods adicionales (2 modelos)
('00000000-0000-0000-0000-000000000001','AirPods Pro 2 USB-C MagSafe','🎧','Base $183 + 15% = Landed $210 | Chip H2 | ANC | USB-C | Región LL/A',788,'airpods','H2',
 ARRAY['White'],ARRAY['Unidad']),

('00000000-0000-0000-0000-000000000001','AirPods Max Sky Blue','🎧','Base $417 + 15% = Landed $480 | Chip H1 | Over-ear ANC | Región AM/A',1800,'airpods','H1',
 ARRAY['Sky Blue','Midnight','Blue','Purple','Starlight','Orange'],ARRAY['Unidad']),

-- Mouse & Teclado (2 accesorios)
('00000000-0000-0000-0000-000000000001','Magic Mouse USB-C','🖱','Base $74 + 15% = Landed $85 | Recargable | Wireless',319,'accesorio',NULL,
 ARRAY['Black','Silver'],ARRAY['Unidad']),

('00000000-0000-0000-0000-000000000001','Magic Keyboard Touch ID','⌨️','Base $104 + 15% = Landed $120 | Touch ID | USB-C',450,'accesorio',NULL,
 ARRAY['Black','Silver'],ARRAY['Unidad']),

-- Bandas Apple Watch (4 modelos)
('00000000-0000-0000-0000-000000000001','Apple Watch Band Sport Loop','⌚','Base $39 + 15% = Landed $45 | Nylon trenzado',169,'accesorio',NULL,
 ARRAY['Midnight','Starlight','Blue','Red','Orange','Green'],ARRAY['41 mm','45 mm','49 mm']),

('00000000-0000-0000-0000-000000000001','Apple Watch Band Braided Solo Loop','⌚','Base $48 + 15% = Landed $55 | Tejido trenzado',206,'accesorio',NULL,
 ARRAY['Starlight','Black','Blue','Red','Pink','Yellow'],ARRAY['41 mm','45 mm']),

('00000000-0000-0000-0000-000000000001','Apple Watch Band Milanese Loop','⌚','Base $57 + 15% = Landed $65 | Acero Inoxidable | Magnético',244,'accesorio',NULL,
 ARRAY['Gold','Silver','Midnight'],ARRAY['41 mm','45 mm']),

('00000000-0000-0000-0000-000000000001','Apple Watch Band Alpine Loop','⌚','Base $48 + 15% = Landed $55 | Nylon alpine | Ultra 49mm',206,'accesorio',NULL,
 ARRAY['Green','Orange','Blue','Beige'],ARRAY['49 mm']),

-- Cargadores MagSafe (3 modelos)
('00000000-0000-0000-0000-000000000001','MagSafe Charger 1m USB-C','🔋','Base $30 + 15% = Landed $35 | 15W | iPhone 12+',131,'accesorio',NULL,
 ARRAY['White'],ARRAY['Unidad']),

('00000000-0000-0000-0000-000000000001','MagSafe Duo Charger','🔋','Base $104 + 15% = Landed $120 | iPhone + Apple Watch',450,'accesorio',NULL,
 ARRAY['White'],ARRAY['Unidad']),

('00000000-0000-0000-0000-000000000001','MagSafe Battery Pack','🔋','Base $74 + 15% = Landed $85 | 1460 mAh | Inalámbrico',319,'accesorio',NULL,
 ARRAY['White'],ARRAY['Unidad']),

-- Case (1 modelo)
('00000000-0000-0000-0000-000000000001','iPhone Case MagSafe Silicone','📱','Base $52 + 15% = Landed $60 | MagSafe | Silicona',225,'accesorio',NULL,
 ARRAY['Midnight','Clay','Storm Blue','Light Pink','Cypress'],ARRAY['iPhone 15','iPhone 16','iPhone 16 Pro','iPhone 16 Pro Max']),

-- AirTag (1 modelo)
('00000000-0000-0000-0000-000000000001','AirTag','🏷','Base $96 + 15% = Landed $110 | Chip U1 + NFC | Pack x4',412,'accesorio','U1',
 ARRAY['White'],ARRAY['1 unidad','Pack x4']);

-- ══════════════════════════════════════════════════════
--  17 accesorios insertados correctamente
--  Watch:4 | AirPods:2 | Mouse/Teclado:2
--  Bandas:4 | MagSafe:3 | Cases:1 | AirTag:1
-- ══════════════════════════════════════════════════════
