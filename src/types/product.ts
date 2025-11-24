export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  unit: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};
