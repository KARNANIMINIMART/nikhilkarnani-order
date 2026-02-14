import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export const SiteSettingsManagement = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [tradePolicy, setTradePolicy] = useState("");
  const [jurisdictionPolicy, setJurisdictionPolicy] = useState("");
  const [deliveryTiming, setDeliveryTiming] = useState("");

  useEffect(() => {
    if (settings) {
      setTradePolicy(settings.trade_policy || "");
      setJurisdictionPolicy(settings.jurisdiction_policy || "");
      setDeliveryTiming(settings.delivery_timing || "");
    }
  }, [settings]);

  const handleSave = async (key: string, value: string, label: string) => {
    try {
      await updateSetting.mutateAsync({ key, value });
      toast.success(`${label} updated successfully`);
    } catch {
      toast.error(`Failed to update ${label}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delivery Timing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>Displayed to customers at checkout</Label>
          <Input
            value={deliveryTiming}
            onChange={(e) => setDeliveryTiming(e.target.value)}
            placeholder="e.g. Next-day delivery for orders before 8 PM"
          />
          <Button
            size="sm"
            className="gap-2"
            onClick={() => handleSave("delivery_timing", deliveryTiming, "Delivery timing")}
            disabled={updateSetting.isPending}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trade Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={tradePolicy}
            onChange={(e) => setTradePolicy(e.target.value)}
            rows={8}
            placeholder="Enter trade policy content..."
          />
          <Button
            size="sm"
            className="gap-2"
            onClick={() => handleSave("trade_policy", tradePolicy, "Trade policy")}
            disabled={updateSetting.isPending}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Jurisdiction Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={jurisdictionPolicy}
            onChange={(e) => setJurisdictionPolicy(e.target.value)}
            rows={8}
            placeholder="Enter jurisdiction policy content..."
          />
          <Button
            size="sm"
            className="gap-2"
            onClick={() => handleSave("jurisdiction_policy", jurisdictionPolicy, "Jurisdiction policy")}
            disabled={updateSetting.isPending}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
