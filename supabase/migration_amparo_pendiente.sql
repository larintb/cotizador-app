-- ================================================================
-- Migration: Amparo Pendiente
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ================================================================

-- 1. Ampliar el check constraint de status para incluir 'pendiente'
ALTER TABLE public.cotizaciones DROP CONSTRAINT cotizaciones_status_check;
ALTER TABLE public.cotizaciones ADD CONSTRAINT cotizaciones_status_check
  CHECK (status IN ('pendiente','validacion','sellado','inspeccion','pedimento','modular','recoger'));

-- 2. Nuevas columnas
ALTER TABLE public.cotizaciones
  ADD COLUMN IF NOT EXISTS client_id    uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS client_email text,
  ADD COLUMN IF NOT EXISTS photo_urls   jsonb;

-- 3. Hacer nullable las columnas financieras (pending quotes no tienen valores aún)
ALTER TABLE public.cotizaciones
  ALTER COLUMN customs_value_usd DROP NOT NULL,
  ALTER COLUMN exchange_rate     DROP NOT NULL,
  ALTER COLUMN agency_fees       DROP NOT NULL,
  ALTER COLUMN result            DROP NOT NULL;
