

# Implementation Plan

This is a large feature set covering 6 areas: product sharing, unified dropdown menu, extended RBAC, limited-time offers, active/inactive sorting, and bulk product upload.

---

## 1. Share Button on Products

Add a share icon on `ProductCard` and `ProductDetailDialog`.

- On mobile: use `navigator.share()` (native share dialog)
- On desktop: copy product link to clipboard with toast confirmation
- Shared link format: `https://nikhilkarnani-order.lovable.app/?product={product-id}`
- On page load, if `?product=` param is present, auto-open the `ProductDetailDialog`

### Files to modify
- `src/components/ProductCard.tsx` -- add a Share icon button
- `src/components/ProductDetailDialog.tsx` -- add Share icon button
- `src/pages/Index.tsx` -- read `?product=` query param and auto-open detail dialog

---

## 2. Unified Dropdown Menu Bar

Replace the individual Header buttons (Admin, Profile, Orders, Logout) with a single "Account" dropdown.

- Use Radix `DropdownMenu` component
- Show/hide items based on role:
  - All logged-in users: Profile, Orders, Logout
  - Admin: Admin Panel link
  - Salesperson: Orders link (already shown)
  - Operations/Editor: Admin Panel link
- Not logged in: show "Sign In" button (no dropdown)
- Mobile-responsive: dropdown works well on small screens

### Files to modify
- `src/components/Header.tsx` -- replace button row with dropdown
- `src/hooks/useAdmin.ts` -- expand to return the user's roles (not just boolean)

---

## 3. Role-Based Access Control

### Database changes
- Extend the `app_role` enum to add: `salesperson`, `operations`, `editor`
- Create `role_audit_logs` table: `id`, `admin_user_id`, `target_user_id`, `action` (assigned/removed), `role`, `created_at`
- RLS: admin-only insert/select on audit logs

### Role permissions
| Role | Products | Orders | Blog | Categories | Settings | User Roles |
|------|----------|--------|------|------------|----------|------------|
| Admin | Full | Full | Full | Full | Full | Full |
| Salesperson | View only | Create + View own | No | No | No | No |
| Operations | Edit (price, description, images, active) | View | No | Edit | No | No |
| Editor | No | No | Full | No | No | No |

### Admin Panel changes
- Add a "Users & Roles" tab (admin-only) to assign/remove roles
- Search users by phone/email, assign roles, see audit log
- Each admin tab conditionally rendered based on user's role(s)
- Create a `useUserRoles` hook that returns all roles for the current user

### Files to create
- `src/components/admin/UserRolesManagement.tsx` -- role assignment UI with audit log
- `src/hooks/useUserRoles.ts` -- fetch current user's roles

### Files to modify
- `src/hooks/useAdmin.ts` -- return role list, add `hasRole()` helper
- `src/pages/AdminPanel.tsx` -- conditionally show tabs based on roles
- `src/components/Header.tsx` -- show Admin link for any admin-level role

---

## 4. Limited Time Offers

### Database changes
Create `offers` table:
- `id`, `title`, `description`, `discount_type` (percentage/fixed), `discount_value`, `start_date`, `end_date`, `product_ids` (uuid array), `max_qty_per_order`, `is_active`, `created_at`, `updated_at`
- RLS: public SELECT for active offers within date range, admin INSERT/UPDATE/DELETE

### Frontend
- Product cards/detail: show offer badge if an active offer applies (e.g., "20% OFF - Limited Time!")
- Cart: apply best applicable offer discount to qualifying products, show savings
- Admin Panel: new "Offers" tab to create/edit offers with date pickers, product multi-select, preview, and active toggle

### Files to create
- `src/components/admin/OffersManagement.tsx`
- `src/hooks/useOffers.ts`

### Files to modify
- `src/components/ProductCard.tsx` -- show offer badge
- `src/components/ProductDetailDialog.tsx` -- show offer info
- `src/components/Cart.tsx` -- apply offer discounts at checkout
- `src/pages/AdminPanel.tsx` -- add Offers tab
- `src/store/cartStore.ts` -- calculate discounted totals

---

## 5. Active/Inactive Product Sorting

Products already have an `is_active` field. Changes needed:

- `src/hooks/useProducts.ts` -- order by `is_active DESC` first, then by brand
- `src/pages/Index.tsx` -- already filters out inactive products for customers (no change needed)
- Admin product list: show active products first, inactive at bottom
- The bulk toggle already exists in `ProductList.tsx` via the existing bulk action system (trending on/off, delete). Add a new bulk action: "Set Active" / "Set Inactive"

### Files to modify
- `src/hooks/useProducts.ts` -- add `is_active` DESC ordering
- `src/components/admin/ProductList.tsx` -- add bulk active/inactive toggle, sort active first in admin view

---

## 6. Bulk Product Update via Excel/CSV

### Approach
- Use a client-side library (`xlsx` / SheetJS) to parse Excel/CSV files in the browser
- No backend function needed -- parse on client, validate, preview, then upsert via Supabase

### Workflow
1. Admin uploads .xlsx or .csv file
2. Client parses to JSON using SheetJS
3. Validate each row (required fields, data types, price > 0, etc.)
4. Show validation errors with row numbers
5. Show preview table of valid rows with diff highlighting (new vs update)
6. Admin confirms, then bulk upsert to `products` table
7. ZIP image upload: extract filenames, match to product names/IDs, upload to storage bucket

### Expected columns
`name`, `brand`, `category`, `price`, `mrp`, `unit`, `description`, `is_trending`, `is_active`

### Files to create
- `src/components/admin/BulkProductUpload.tsx` -- upload, parse, validate, preview, commit UI

### Files to modify
- `src/pages/AdminPanel.tsx` -- add "Bulk Upload" section within Products tab

### New dependency
- `xlsx` (SheetJS) -- for parsing Excel files client-side

---

## Technical Details

### Database Migration SQL

```sql
-- 1. Extend app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'salesperson';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';

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

-- 6. Salesperson: can insert orders and view own orders (already covered by existing RLS)
-- No additional policies needed since orders RLS already uses auth.uid() = user_id

-- 7. Operations can manage categories
CREATE POLICY "Operations can update categories"
  ON public.categories FOR UPDATE
  USING (has_role(auth.uid(), 'operations'));
```

### Complete File Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/ProductCard.tsx` | Modify | Add share button |
| `src/components/ProductDetailDialog.tsx` | Modify | Add share button |
| `src/pages/Index.tsx` | Modify | Handle `?product=` deep link |
| `src/components/Header.tsx` | Modify | Unified Account dropdown |
| `src/hooks/useAdmin.ts` | Modify | Return role list |
| `src/hooks/useUserRoles.ts` | Create | Fetch user roles |
| `src/hooks/useOffers.ts` | Create | Fetch active offers |
| `src/components/admin/UserRolesManagement.tsx` | Create | Role assignment + audit UI |
| `src/components/admin/OffersManagement.tsx` | Create | Offer CRUD with preview |
| `src/components/admin/BulkProductUpload.tsx` | Create | Excel upload, validate, preview, commit |
| `src/pages/AdminPanel.tsx` | Modify | Add Offers, Users tabs; role-based tab visibility |
| `src/components/admin/ProductList.tsx` | Modify | Bulk active/inactive; sort active first |
| `src/hooks/useProducts.ts` | Modify | Sort by is_active DESC |
| `src/components/Cart.tsx` | Modify | Apply offer discounts |
| `src/store/cartStore.ts` | Modify | Offer-aware total calculation |
| `src/types/product.ts` | Modify | Add Offer type |

### New dependency
- `xlsx` (SheetJS) -- Excel/CSV parsing

