import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Store, Phone, MapPin, Loader2 } from "lucide-react";
import { z } from "zod";
import type { Session } from "@supabase/supabase-js";

const phoneSchema = z.string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number must be less than 15 digits")
  .regex(/^\+?[1-9]\d{9,14}$/, "Please enter a valid phone number with country code (e.g., +911234567890)");

const otpSchema = z.string()
  .length(6, "OTP must be 6 digits")
  .regex(/^\d{6}$/, "OTP must contain only numbers");

const profileSchema = z.object({
  address: z.string().max(500, "Address must be less than 500 characters").optional(),
  google_location: z.string().max(1000, "Location must be less than 1000 characters").optional(),
});

export default function AuthPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [address, setAddress] = useState("");
  const [googleLocation, setGoogleLocation] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        // Redirect authenticated users to home
        if (session) {
          setTimeout(() => {
            navigate("/");
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    const phoneValidation = phoneSchema.safeParse(phone);
    if (!phoneValidation.success) {
      toast({
        title: "Invalid Phone Number",
        description: phoneValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) throw error;

      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code",
      });
      setStep("otp");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate OTP
    const otpValidation = otpSchema.safeParse(otp);
    if (!otpValidation.success) {
      toast({
        title: "Invalid OTP",
        description: otpValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms'
      });

      if (error) throw error;

      if (data.session) {
        toast({
          title: "Success",
          description: "Phone number verified successfully",
        });
        setStep("profile");
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate profile data
    const profileValidation = profileSchema.safeParse({ address, google_location: googleLocation });
    if (!profileValidation.success) {
      toast({
        title: "Invalid Input",
        description: profileValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({
          address: address || null,
          google_location: googleLocation || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your information has been saved",
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile. You can update it later.",
        variant: "destructive",
      });
      // Still navigate even if profile update fails
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipProfile = () => {
    navigate("/");
  };

  if (session) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary mb-4">
            <Store className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Nikhil Karnani</h1>
          <p className="text-sm text-muted-foreground">Premium Food Supplies</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          {step === "phone" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-card-foreground">Sign In</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your phone number to receive a verification code
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+911234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +91 for India)
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-card-foreground">Enter OTP</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to {phone}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                  disabled={loading}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify OTP
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("phone")}
                  disabled={loading}
                >
                  Change Phone Number
                </Button>
              </div>
            </form>
          )}

          {step === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-card-foreground">Complete Your Profile</h2>
                <p className="text-sm text-muted-foreground">
                  Optional: Add your delivery details for faster checkout
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    type="text"
                    placeholder="Enter your delivery address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Google Location (Optional)</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Paste Google Maps link"
                  value={googleLocation}
                  onChange={(e) => setGoogleLocation(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save & Continue
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleSkipProfile}
                  disabled={loading}
                >
                  Skip for Now
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing, you agree to receive SMS verification codes
        </p>
      </div>
    </div>
  );
}
