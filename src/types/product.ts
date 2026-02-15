export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  mrp?: number | null;
  unit: string;
  image_url?: string | null;
  video_url?: string | null;
  is_trending?: boolean;
  is_active?: boolean;
  description?: string | null;
  images?: string[] | null;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Offer = {
  id: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  start_date: string;
  end_date: string;
  product_ids: string[];
  max_qty_per_order: number | null;
  is_active: boolean;
};
