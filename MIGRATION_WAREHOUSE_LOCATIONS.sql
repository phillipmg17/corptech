-- ============================================================
-- MIGRATION: Ubicación de almacenes (departamento + ciudad)
-- Corre esto en Supabase → SQL Editor → Run
-- ============================================================

ALTER TABLE public.warehouses
  ADD COLUMN IF NOT EXISTS department TEXT,   -- Departamento / Estado (Lima, Arequipa, etc.)
  ADD COLUMN IF NOT EXISTS city       TEXT;   -- Ciudad o ubicación puntual (Miraflores, SJL, etc.)

-- Índice para agrupar
CREATE INDEX IF NOT EXISTS idx_warehouses_department ON public.warehouses(department);

-- Listo ✅
-- warehouses ahora tiene: department (departamento/estado) y city (ciudad/lugar puntual)
