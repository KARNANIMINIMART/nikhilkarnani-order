import { Header } from "@/components/Header";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Loader2 } from "lucide-react";

const TradePolicy = () => {
  const { data: settings, isLoading } = useSiteSettings();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Trade Policy</h1>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap rounded-lg border border-border bg-card p-6">
            {settings?.trade_policy || "No trade policy available."}
          </div>
        )}
      </main>
    </div>
  );
};

export default TradePolicy;
