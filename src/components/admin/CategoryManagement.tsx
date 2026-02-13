import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Image } from "lucide-react";

type Category = {
  id: string;
  name: string;
  image_url: string | null;
  is_active: boolean;
};

export const CategoryManagement = () => {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const addCategory = async () => {
    const name = newName.trim();
    if (!name) { toast.error("Enter a category name"); return; }
    try {
      const { error } = await supabase.from("categories").insert({ name });
      if (error) throw error;
      toast.success(`Category "${name}" added`);
      setNewName("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to add");
    }
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase.from("categories").update({ is_active }).eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleImageUpload = async (id: string, file: File) => {
    setUploading(id);
    try {
      const ext = file.name.split(".").pop();
      const path = `categories/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
      const { error: updateErr } = await supabase.from("categories").update({ image_url: publicUrl }).eq("id", id);
      if (updateErr) throw updateErr;
      toast.success("Image uploaded");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  if (isLoading) return <p className="text-muted-foreground py-4">Loading categories...</p>;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
          className="max-w-xs"
        />
        <Button onClick={addCategory} className="gap-2">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            {cat.image_url ? (
              <img src={cat.image_url} alt="" className="h-10 w-10 rounded-md object-cover flex-shrink-0" />
            ) : (
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <Image className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{cat.name}</p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(cat.id, file);
                }}
                disabled={uploading === cat.id}
              />
              <span className="text-xs text-primary hover:underline">
                {uploading === cat.id ? "Uploading..." : "Upload Image"}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <Switch
                checked={cat.is_active}
                onCheckedChange={(v) => toggleActive(cat.id, v)}
              />
              <span className="text-xs text-muted-foreground w-14">
                {cat.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCategory(cat.id, cat.name)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
