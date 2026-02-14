import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const siteUrl = "https://nikhilkarnani-order.lovable.app";

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(50);

  const escapeXml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  let rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n`;
  rss += `  <title>KARNANI MINIMART Blog</title>\n`;
  rss += `  <link>${siteUrl}/blog</link>\n`;
  rss += `  <description>Latest news and updates from KARNANI MINIMART</description>\n`;
  rss += `  <language>en</language>\n`;

  if (posts) {
    for (const post of posts) {
      rss += `  <item>\n`;
      rss += `    <title>${escapeXml(post.title)}</title>\n`;
      rss += `    <link>${siteUrl}/blog/${post.slug}</link>\n`;
      rss += `    <guid>${siteUrl}/blog/${post.slug}</guid>\n`;
      if (post.excerpt) rss += `    <description>${escapeXml(post.excerpt)}</description>\n`;
      if (post.published_at) rss += `    <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>\n`;
      if (post.category) rss += `    <category>${escapeXml(post.category)}</category>\n`;
      rss += `  </item>\n`;
    }
  }

  rss += `</channel>\n</rss>`;

  return new Response(rss, {
    headers: { ...corsHeaders, "Content-Type": "application/rss+xml" },
  });
});
