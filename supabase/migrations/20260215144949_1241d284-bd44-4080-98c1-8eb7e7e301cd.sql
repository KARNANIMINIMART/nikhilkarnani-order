
-- 1. Extend app_role enum (must be separate transaction)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'salesperson';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
