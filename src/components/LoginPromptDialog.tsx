import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, X } from "lucide-react";

export const LoginPromptDialog = () => {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session || dismissed) return;

      timer = setTimeout(() => {
        setOpen(true);
      }, 60000);
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setOpen(false);
          clearTimeout(timer);
        }
      }
    );

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [dismissed]);

  const handleLogin = () => {
    setOpen(false);
    navigate("/auth");
  };

  const handleDismiss = () => {
    setOpen(false);
    setDismissed(true);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to KARNANI MINIMART!</DialogTitle>
          <DialogDescription className="mt-2">
            Sign in with Google to place orders, track deliveries, and save your profile.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button className="w-full gap-2" size="lg" onClick={handleLogin}>
            <LogIn className="h-4 w-4" /> Sign in with Google
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Continue browsing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
