import { 
  Milk, 
  Beef, 
  Droplet, 
  Sparkles, 
  Egg, 
  Soup, 
  CandyCane, 
  Cookie, 
  ChefHat, 
  Cherry, 
  IceCream, 
  Coffee,
  Snowflake,
  LucideIcon
} from "lucide-react";

export type CategoryConfig = {
  name: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
};

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  "Cheese": {
    name: "Cheese",
    icon: Milk,
    color: "text-category-cheese",
    bgColor: "bg-category-cheese/10 hover:bg-category-cheese/20"
  },
  "Butter": {
    name: "Butter",
    icon: Beef,
    color: "text-category-butter",
    bgColor: "bg-category-butter/10 hover:bg-category-butter/20"
  },
  "Ketchup": {
    name: "Ketchup",
    icon: Droplet,
    color: "text-category-ketchup",
    bgColor: "bg-category-ketchup/10 hover:bg-category-ketchup/20"
  },
  "Seasoning": {
    name: "Seasoning",
    icon: Sparkles,
    color: "text-category-seasoning",
    bgColor: "bg-category-seasoning/10 hover:bg-category-seasoning/20"
  },
  "Mayonnaise": {
    name: "Mayonnaise",
    icon: Egg,
    color: "text-category-mayonnaise",
    bgColor: "bg-category-mayonnaise/10 hover:bg-category-mayonnaise/20"
  },
  "Sauces": {
    name: "Sauces",
    icon: Soup,
    color: "text-category-sauces",
    bgColor: "bg-category-sauces/10 hover:bg-category-sauces/20"
  },
  "Syrup": {
    name: "Syrup",
    icon: CandyCane,
    color: "text-category-syrup",
    bgColor: "bg-category-syrup/10 hover:bg-category-syrup/20"
  },
  "Bread Crumb": {
    name: "Bread Crumb",
    icon: Cookie,
    color: "text-category-breadcrumb",
    bgColor: "bg-category-breadcrumb/10 hover:bg-category-breadcrumb/20"
  },
  "Premix": {
    name: "Premix",
    icon: ChefHat,
    color: "text-category-premix",
    bgColor: "bg-category-premix/10 hover:bg-category-premix/20"
  },
  "Purree": {
    name: "Purree",
    icon: Cherry,
    color: "text-category-purree",
    bgColor: "bg-category-purree/10 hover:bg-category-purree/20"
  },
  "Cream": {
    name: "Cream",
    icon: IceCream,
    color: "text-category-cream",
    bgColor: "bg-category-cream/10 hover:bg-category-cream/20"
  },
  "Instant Coffee": {
    name: "Instant Coffee",
    icon: Coffee,
    color: "text-category-coffee",
    bgColor: "bg-category-coffee/10 hover:bg-category-coffee/20"
  },
  "Frozen snacks": {
    name: "Frozen snacks",
    icon: Snowflake,
    color: "text-category-frozen",
    bgColor: "bg-category-frozen/10 hover:bg-category-frozen/20"
  }
};
