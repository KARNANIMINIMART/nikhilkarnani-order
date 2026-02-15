
-- 2. Role audit logs
CREATE TABLE public.role_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  action text NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.role_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs"
  ON public.role_audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert audit logs"
  ON public.role_audit_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. Offers table
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  product_ids uuid[] DEFAULT '{}',
  max_qty_per_order integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active offers viewable by everyone"
  ON public.offers FOR SELECT USING (true);
CREATE POLICY "Admins can insert offers"
  ON public.offers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update offers"
  ON public.offers FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete offers"
  ON public.offers FOR DELETE
  USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 4. RLS for operations role on products
CREATE POLICY "Operations can update products"
  ON public.products FOR UPDATE
  USING (has_role(auth.uid(), 'operations'));

-- 5. RLS for editor role on blog_posts
CREATE POLICY "Editors can insert blog posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'editor'));
CREATE POLICY "Editors can update blog posts"
  ON public.blog_posts FOR UPDATE
  USING (has_role(auth.uid(), 'editor'));
CREATE POLICY "Editors can view all blog posts"
  ON public.blog_posts FOR SELECT
  USING (has_role(auth.uid(), 'editor'));

-- 6. Operations can manage categories
CREATE POLICY "Operations can update categories"
  ON public.categories FOR UPDATE
  USING (has_role(auth.uid(), 'operations'));
