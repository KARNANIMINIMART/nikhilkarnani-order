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
};

export type CartItem = {
  product: Product;
  quantity: number;
};
