import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, BRANDS } from "@/data/products";
import { CATEGORY_CONFIG } from "@/data/categories";
import { Search, X, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";

type FiltersProps = {
  onFilterChange: (filters: {
    search: string;
    category: string;
    brand: string;
  }) => void;
};

export const Filters = ({ onFilterChange }: FiltersProps) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ search: value, category, brand });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    onFilterChange({ search, category: value, brand });
  };

  const handleBrandChange = (value: string) => {
    setBrand(value);
    onFilterChange({ search, category, brand: value });
  };

  const handleClear = () => {
    setSearch("");
    setCategory("all");
    setBrand("all");
    onFilterChange({ search: "", category: "all", brand: "all" });
  };

  const hasActiveFilters = search || category !== "all" || brand !== "all";

  return (
    <div className="mb-6 space-y-4 rounded-lg border border-border bg-card p-4">
      {/* Search and Brand Filter Row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={brand} onValueChange={handleBrandChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {BRANDS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" size="icon" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Category Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Grid3x3 className="h-4 w-4" />
          <span>Categories</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCategoryChange("all")}
            className={cn(
              "rounded-full transition-all",
              category === "all"
                ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                : "hover:border-primary/50"
            )}
          >
            All
          </Button>
          {CATEGORIES.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const Icon = config?.icon;
            return (
              <Button
                key={cat}
                variant="outline"
                size="sm"
                onClick={() => handleCategoryChange(cat)}
                className={cn(
                  "rounded-full transition-all border",
                  category === cat
                    ? `${config?.bgColor} border-current ${config?.color}`
                    : "hover:border-primary/50"
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5 mr-1.5" />}
                {cat}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
