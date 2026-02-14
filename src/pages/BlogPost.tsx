import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { SocialShareButtons } from "@/components/SocialShareButtons";
import { useBlogPost } from "@/hooks/useBlogPosts";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug || "");

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.meta_description || post.excerpt || "",
        image: post.image_url || undefined,
        datePublished: post.published_at || post.created_at,
        dateModified: post.updated_at,
        author: { "@type": "Organization", name: "KARNANI MINIMART" },
        publisher: { "@type": "Organization", name: "KARNANI MINIMART" },
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      {post && (
        <SEOHead
          title={post.meta_title || `${post.title} - KARNANI MINIMART Blog`}
          description={post.meta_description || post.excerpt || ""}
          ogTitle={post.meta_title || post.title}
          ogDescription={post.meta_description || post.excerpt || ""}
          ogImage={post.image_url || undefined}
          ogType="article"
          canonicalUrl={pageUrl}
          jsonLd={jsonLd}
        />
      )}
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !post ? (
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-foreground mb-2">Post not found</h1>
            <p className="text-muted-foreground">This blog post may have been removed or doesn't exist.</p>
          </div>
        ) : (
          <article>
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-64 sm:h-80 object-cover rounded-lg mb-6"
              />
            )}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {post.category && <Badge variant="secondary">{post.category}</Badge>}
              {post.published_at && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(post.published_at), "dd MMM yyyy")}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">{post.title}</h1>

            <SocialShareButtons url={pageUrl} title={post.title} description={post.excerpt || ""} />

            <div className="mt-6 prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
              {post.content}
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        )}
      </main>
    </div>
  );
};

export default BlogPost;
