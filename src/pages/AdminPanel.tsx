import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useProducts } from "@/hooks/useProducts";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Package, ClipboardList, FolderTree, Settings, FileText, Tag, Users } from "lucide-react";
import { toast } from "sonner";
import { ProductList } from "@/components/admin/ProductList";
import { OrderManagement } from "@/components/admin/OrderManagement";
import { CategoryManagement } from "@/components/admin/CategoryManagement";
import { SiteSettingsManagement } from "@/components/admin/SiteSettingsManagement";
import { BlogManagement } from "@/components/admin/BlogManagement";
import { OffersManagement } from "@/components/admin/OffersManagement";
import { UserRolesManagement } from "@/components/admin/UserRolesManagement";
import { BulkProductUpload } from "@/components/admin/BulkProductUpload";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: roles = [], isLoading: rolesLoading } = useUserRoles();
  const { data: products = [], isLoading } = useProducts();

  const hasRole = (r: string) => roles.includes(r as any);
  const hasAnyRole = hasRole("admin") || hasRole("operations") || hasRole("editor") || hasRole("salesperson");

  useEffect(() => {
    if (!adminLoading && !rolesLoading && !hasAnyRole) {
      toast.error("Access denied. No admin role assigned.");
      navigate("/");
    }
  }, [hasAnyRole, adminLoading, rolesLoading, navigate]);

  if (adminLoading || rolesLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAnyRole) return null;

  const showProducts = hasRole("admin") || hasRole("operations");
  const showCategories = hasRole("admin") || hasRole("operations");
  const showOrders = hasRole("admin") || hasRole("salesperson");
  const showSettings = hasRole("admin");
  const showBlog = hasRole("admin") || hasRole("editor");
  const showOffers = hasRole("admin");
  const showUsers = hasRole("admin");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        </div>

        <Tabs defaultValue={showProducts ? "products" : showOrders ? "orders" : showBlog ? "blog" : "products"}>
          <TabsList className="mb-6 flex-wrap">
            {showProducts && (
              <TabsTrigger value="products" className="gap-2">
                <Package className="h-4 w-4" /> Products
              </TabsTrigger>
            )}
            {showCategories && (
              <TabsTrigger value="categories" className="gap-2">
                <FolderTree className="h-4 w-4" /> Categories
              </TabsTrigger>
            )}
            {showOrders && (
              <TabsTrigger value="orders" className="gap-2">
                <ClipboardList className="h-4 w-4" /> Orders
              </TabsTrigger>
            )}
            {showSettings && (
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" /> Settings
              </TabsTrigger>
            )}
            {showBlog && (
              <TabsTrigger value="blog" className="gap-2">
                <FileText className="h-4 w-4" /> Blog
              </TabsTrigger>
            )}
            {showOffers && (
              <TabsTrigger value="offers" className="gap-2">
                <Tag className="h-4 w-4" /> Offers
              </TabsTrigger>
            )}
            {showUsers && (
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" /> Users & Roles
              </TabsTrigger>
            )}
          </TabsList>

          {showProducts && (
            <TabsContent value="products">
              <ProductList products={products} />
              <div className="mt-6">
                <BulkProductUpload />
              </div>
            </TabsContent>
          )}
          {showCategories && (
            <TabsContent value="categories">
              <CategoryManagement />
            </TabsContent>
          )}
          {showOrders && (
            <TabsContent value="orders">
              <OrderManagement />
            </TabsContent>
          )}
          {showSettings && (
            <TabsContent value="settings">
              <SiteSettingsManagement />
            </TabsContent>
          )}
          {showBlog && (
            <TabsContent value="blog">
              <BlogManagement />
            </TabsContent>
          )}
          {showOffers && (
            <TabsContent value="offers">
              <OffersManagement />
            </TabsContent>
          )}
          {showUsers && (
            <TabsContent value="users">
              <UserRolesManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
