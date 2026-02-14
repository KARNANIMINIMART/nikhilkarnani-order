
-- Add extended profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS manager_name text,
  ADD COLUMN IF NOT EXISTS gst_number text,
  ADD COLUMN IF NOT EXISTS udyam_aadhaar text,
  ADD COLUMN IF NOT EXISTS pan_card text,
  ADD COLUMN IF NOT EXISTS outlet_name text;

-- Add special_requests to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS special_requests text;
