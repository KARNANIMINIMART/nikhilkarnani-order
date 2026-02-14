
# Implementation Plan

This plan covers four major areas: rebranding, blog system, on-page SEO, and off-page SEO support. There is also a build error fix in Cart.tsx.

---

## 0. Fix Existing Build Error

The file `src/components/Cart.tsx` has a syntax error at line 385. This will be diagnosed and fixed first.

---

## 1. Rebrand "Nikhil Karnani" to "KARNANI MINIMART"

Replace all occurrences across:

- **index.html** -- title, meta description, author, og:title, og:description
- **src/pages/AuthPage.tsx** -- heading text on the login page
- **src/components/admin/OrderManagement.tsx** -- WhatsApp delivery notification message
- **src/pages/Index.tsx** -- footer banner (already says "KARNANI MINIMART HORECA", will align)

---

## 2. Blog System

### Database
Create two new tables via migration:

- **blog_posts**: `id`, `title`, `slug` (unique, SEO-friendly URL), `content` (markdown/rich text), `excerpt`, `image_url`, `category`, `tags` (text array), `meta_title`, `meta_description`, `is_published` (boolean), `published_at`, `created_at`, `updated_at`
- RLS: public SELECT for published posts, admin-only INSERT/UPDATE/DELETE

### New Files
- **src/pages/Blog.tsx** -- Blog listing page with category/tag filtering
- **src/pages/BlogPost.tsx** -- Individual post page with SEO meta tags, social share buttons, and internal links to products/categories
- **src/components/admin/BlogManagement.tsx** -- Admin interface for creating/editing posts with title, content, images (uploaded to storage), categories, tags, and SEO fields

### Routes
Add `/blog` and `/blog/:slug` routes in `App.tsx`

---

## 3. On-Page SEO Features

- **Dynamic meta tags**: Create a reusable `src/components/SEOHead.tsx` component using `document.title` and meta tag manipulation for each page (product detail, blog post, policy pages)
- **Schema markup**: Add JSON-LD structured data for:
  - Organization (homepage)
  - Product (product detail dialog)
  - BlogPosting (blog posts)
- **Alt text**: Product images already have alt text; blog image uploads will include alt text fields
- **Optimized headers**: Ensure proper h1/h2/h3 hierarchy on all pages

---

## 4. Off-Page SEO Support

- **RSS Feed**: Create a backend function `rss-feed` that generates an XML RSS feed from published blog posts
- **Sitemap**: Create a backend function `sitemap` that auto-generates `sitemap.xml` listing all product pages, blog posts, and policy pages
- **robots.txt**: Already exists; will be updated to include sitemap URL reference
- **Social share buttons**: Add share buttons (WhatsApp, Facebook, Twitter/X, copy link) on blog posts and product detail views
- **Crawlability**: All product listing, blog, and policy pages remain fully accessible without login

---

## Technical Details

### Database Migration SQL
```sql
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL DEFAULT '',
  excerpt text,
  image_url text,
  category text,
  tags text[] DEFAULT '{}',
  meta_title text,
  meta_description text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read for published posts
CREATE POLICY "Published blog posts viewable by everyone"
  ON public.blog_posts FOR SELECT USING (is_published = true);

-- Admin full access
CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Auto-update timestamp trigger
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

### Files to Create
| File | Purpose |
|------|---------|
| `src/pages/Blog.tsx` | Blog listing page |
| `src/pages/BlogPost.tsx` | Individual blog post page |
| `src/components/admin/BlogManagement.tsx` | Admin blog editor |
| `src/components/SEOHead.tsx` | Reusable SEO meta tag component |
| `src/components/SocialShareButtons.tsx` | Share buttons component |
| `src/hooks/useBlogPosts.ts` | Blog data fetching hooks |
| `supabase/functions/sitemap/index.ts` | Auto-generated sitemap.xml |
| `supabase/functions/rss-feed/index.ts` | RSS feed for blog posts |

### Files to Modify
| File | Change |
|------|--------|
| `index.html` | Rebrand meta tags, add schema markup |
| `src/App.tsx` | Add blog routes |
| `src/pages/AuthPage.tsx` | Rebrand heading |
| `src/components/admin/OrderManagement.tsx` | Rebrand WhatsApp message |
| `src/pages/Index.tsx` | Add blog link in footer |
| `src/pages/AdminPanel.tsx` | Add Blog tab |
| `src/components/ProductDetailDialog.tsx` | Add social share + schema markup |
| `src/components/Cart.tsx` | Fix build error |
| `public/robots.txt` | Add Sitemap directive |
| `supabase/config.toml` | Add edge function configs with `verify_jwt = false` |
