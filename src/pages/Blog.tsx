import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const Blog = () => {
  const { data: posts = [], isLoading } = useBlogPosts(true);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog - KARNANI MINIMART"
        description="Latest news, recipes, and updates from KARNANI MINIMART - Premium HoReCa Food Supplies in Jaipur."
        ogTitle="Blog - KARNANI MINIMART"
        ogDescription="Latest news, recipes, and updates from KARNANI MINIMART."
      />
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Blog</h1>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">No blog posts yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
              >
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {post.category && (
                      <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                    )}
                    {post.published_at && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(post.published_at), "dd MMM yyyy")}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Blog;
