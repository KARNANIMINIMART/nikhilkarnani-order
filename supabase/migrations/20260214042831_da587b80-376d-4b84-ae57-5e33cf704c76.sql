
-- Create site_settings table for editable content like policies and delivery timing
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Settings viewable by everyone"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can update
CREATE POLICY "Admins can update settings"
ON public.site_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert
CREATE POLICY "Admins can insert settings"
ON public.site_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('trade_policy', 'Trade policy content goes here. Edit this from the Admin Panel.'),
  ('jurisdiction_policy', 'Jurisdiction policy content goes here. Edit this from the Admin Panel.'),
  ('delivery_timing', 'Next-day delivery available for orders placed before 8 PM');
