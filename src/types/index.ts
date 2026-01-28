export interface Category {
  id: number;
  name: string;
  icon?: string;
  is_active: boolean;
}

export interface AddonItem {
  id: number;
  group_id: number;
  name: string;
  price: number;
  is_available: boolean;
}

export interface AddonGroup {
  id: number;
  name: string;
  description?: string;
  items: AddonItem[];
}

export interface ProductAddonConfig {
  id: number;
  group_id: number;
  min_selection: number;
  max_selection: number;
  order: number;
  group: AddonGroup;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  price: number;
  stock_qty: number;
  is_active: boolean;
  addon_configs?: ProductAddonConfig[];
  category?: Category;
}

export interface Event {
  id: number;
  name: string;
  location?: string;
  start_time: string;
  is_active: boolean;
}

export interface SelectedAddon {
  id: number;
  name: string;
  price: number;
}

export interface CartItem {
  internalId: string;
  product: Product;
  quantity: number;
  selectedAddons: SelectedAddon[];
  totalPrice: number;
}
