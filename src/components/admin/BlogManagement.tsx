import { useState } from "react";
import { useBlogPosts, useUpsertBlogPost, useDeleteBlogPost, type BlogPost } from "@/hooks/useBlogPosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

const emptyPost = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  image_url: "",
  category: "",
  tags: [] as string[],
  meta_title: "",
  meta_description: "",
  is_published: false,
};

export const BlogManagement = () => {
  const { data: posts = [], isLoading } = useBlogPosts(false);
  const upsertMutation = useUpsertBlogPost();
  const deleteMutation = useDeleteBlogPost();
  const [editing, setEditing] = useState<(Partial<BlogPost> & typeof emptyPost) | null>(null);
  const [tagInput, setTagInput] = useState("");

  const openNew = () => {
    setEditing({ ...emptyPost });
    setTagInput("");
  };

  const openEdit = (post: BlogPost) => {
    setEditing({ ...post });
    setTagInput("");
  };

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const slug = editing.slug || generateSlug(editing.title);
    try {
      await upsertMutation.mutateAsync({
        ...editing,
        slug,
        published_at: editing.is_published && !editing.published_at ? new Date().toISOString() : editing.published_at || null,
      } as any);
      toast.success(editing.id ? "Post updated" : "Post created");
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Post deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const addTag = () => {
    if (!editing || !tagInput.trim()) return;
    const tag = tagInput.trim().toLowerCase();
    if (!editing.tags?.includes(tag)) {
      setEditing({ ...editing, tags: [...(editing.tags || []), tag] });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    if (!editing) return;
    setEditing({ ...editing, tags: (editing.tags || []).filter((t) => t !== tag) });
  };

  if (isLoading) return <p className="text-muted-foreground py-8 text-center">Loading posts...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{posts.length} posts</p>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New Post
        </Button>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-foreground truncate">{post.title}</h3>
                {post.is_published ? (
                  <Badge variant="default" className="text-xs"><Eye className="h-3 w-3 mr-1" />Published</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs"><EyeOff className="h-3 w-3 mr-1" />Draft</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                /blog/{post.slug} • {format(new Date(post.updated_at), "dd MMM yyyy")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(post)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(post.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Post" : "New Post"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    placeholder={generateSlug(editing.title) || "auto-generated"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  rows={10}
                />
              </div>

              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea
                  value={editing.excerpt || ""}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input value={editing.image_url || ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                </div>
                {editing.tags && editing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {editing.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        #{tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground mb-3">SEO Settings</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Meta Title</Label>
                    <Input value={editing.meta_title || ""} onChange={(e) => setEditing({ ...editing, meta_title: e.target.value })} maxLength={60} />
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Description</Label>
                    <Input value={editing.meta_description || ""} onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })} maxLength={160} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editing.is_published}
                    onCheckedChange={(checked) => setEditing({ ...editing, is_published: checked })}
                  />
                  <Label>{editing.is_published ? "Published" : "Draft"}</Label>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={upsertMutation.isPending}>Save</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
