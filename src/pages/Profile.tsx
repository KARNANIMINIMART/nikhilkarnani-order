import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Loader2, User, Building2, FileText } from "lucide-react";
import { z } from "zod";
import type { Session } from "@supabase/supabase-js";

const profileSchema = z.object({
  address: z.string().max(500, "Address must be less than 500 characters").optional(),
  google_location: z.string().max(1000, "Location must be less than 1000 characters").optional(),
  owner_name: z.string().max(100).optional(),
  manager_name: z.string().max(100).optional(),
  gst_number: z.string().max(20).optional(),
  udyam_aadhaar: z.string().max(30).optional(),
  pan_card: z.string().max(15).optional(),
  outlet_name: z.string().max(200).optional(),
});

export default function Profile() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [googleLocation, setGoogleLocation] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [udyamAadhaar, setUdyamAadhaar] = useState("");
  const [panCard, setPanCard] = useState("");
  const [outletName, setOutletName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (!session) { navigate("/auth"); return; }
      await fetchProfile();
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) navigate("/auth");
      }
    );
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (profileData) {
        setPhone(profileData.phone || "");
        setAddress(profileData.address || "");
        setGoogleLocation(profileData.google_location || "");
        setOwnerName(profileData.owner_name || "");
        setManagerName(profileData.manager_name || "");
        setGstNumber(profileData.gst_number || "");
        setUdyamAadhaar(profileData.udyam_aadhaar || "");
        setPanCard(profileData.pan_card || "");
        setOutletName(profileData.outlet_name || "");
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({ title: "Error", description: "Failed to load profile.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = profileSchema.safeParse({
      address, google_location: googleLocation,
      owner_name: ownerName, manager_name: managerName,
      gst_number: gstNumber, udyam_aadhaar: udyamAadhaar,
      pan_card: panCard, outlet_name: outletName,
    });
    if (!validation.success) {
      toast({ title: "Invalid Input", description: validation.error.errors[0].message, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({
          address: address || null,
          google_location: googleLocation || null,
          owner_name: ownerName || null,
          manager_name: managerName || null,
          gst_number: gstNumber || null,
          udyam_aadhaar: udyamAadhaar || null,
          pan_card: panCard || null,
          outlet_name: outletName || null,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast({ title: "Profile Updated", description: "Your information has been saved successfully" });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({ title: "Error", description: error.message || "Failed to save profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your business & delivery information</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
              <p className="text-sm text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        ) : (
          <Card className="p-6 max-w-2xl">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Phone - readonly */}
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" type="tel" value={phone} className="pl-10 bg-muted" disabled readOnly />
                </div>
                <p className="text-xs text-muted-foreground">Linked to your Gmail login</p>
              </div>

              {/* Outlet Name */}
              <div className="space-y-2">
                <Label htmlFor="outletName">Outlet Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="outletName" placeholder="Your business/outlet name" value={outletName} onChange={(e) => setOutletName(e.target.value)} className="pl-10" disabled={saving} />
                </div>
              </div>

              {/* Owner & Manager Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input id="ownerName" placeholder="Owner name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} disabled={saving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerName">Manager Name</Label>
                  <Input id="managerName" placeholder="Manager name" value={managerName} onChange={(e) => setManagerName(e.target.value)} disabled={saving} />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="address" placeholder="Enter your delivery address" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10" disabled={saving} />
                </div>
              </div>

              {/* Google Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Google Location (Optional)</Label>
                <Input id="location" placeholder="Paste Google Maps link" value={googleLocation} onChange={(e) => setGoogleLocation(e.target.value)} disabled={saving} />
                <p className="text-xs text-muted-foreground">Share your Google Maps location for accurate delivery</p>
              </div>

              {/* Business Details */}
              <div className="pt-2 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Business Details (Optional)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gst">GST Number</Label>
                    <Input id="gst" placeholder="e.g. 08AAACH..." value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} disabled={saving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="udyam">Udyam Aadhaar</Label>
                    <Input id="udyam" placeholder="e.g. UDYAM-..." value={udyamAadhaar} onChange={(e) => setUdyamAadhaar(e.target.value)} disabled={saving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pan">PAN Card Number</Label>
                    <Input id="pan" placeholder="e.g. ABCDE1234F" value={panCard} onChange={(e) => setPanCard(e.target.value)} disabled={saving} />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}
