import { create } from "zustand";
import { CartItem, Product, SelectedAddon } from "@/types";

interface CartState {
  items: CartItem[];
  addItem: (
    product: Product,
    quantity: number,
    addons?: SelectedAddon[],
  ) => void;
  removeItem: (internalId: string) => void;
  updateQuantity: (internalId: string, delta: number) => void;
  clearCart: () => void;

  totalAmount: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product, quantity, addons = []) => {
    const items = get().items;

    const addonsTotal = addons.reduce(
      (sum, addon) => sum + Number(addon.price),
      0,
    );
    const unitPrice = Number(product.price) + addonsTotal;
    const lineTotal = unitPrice * quantity;

    const addonIds = addons
      .map((a) => a.id)
      .sort()
      .join("-");
    const compositionId = `${product.id}-${addonIds}`;

    const existingItemIndex = items.findIndex((item) => {
      const itemAddonIds = item.selectedAddons
        .map((a) => a.id)
        .sort()
        .join("-");
      return item.product.id === product.id && itemAddonIds === addonIds;
    });

    if (existingItemIndex > -1) {
      const newItems = [...items];
      newItems[existingItemIndex].quantity += quantity;
      newItems[existingItemIndex].totalPrice += lineTotal;
      set({ items: newItems });
    } else {
      const newItem: CartItem = {
        internalId: crypto.randomUUID(),
        product,
        quantity,
        selectedAddons: addons,
        totalPrice: lineTotal,
      };
      set({ items: [...items, newItem] });
    }
  },

  removeItem: (internalId) => {
    set({ items: get().items.filter((i) => i.internalId !== internalId) });
  },

  updateQuantity: (internalId, delta) => {
    const items = get().items.map((item) => {
      if (item.internalId === internalId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;

        const addonsTotal = item.selectedAddons.reduce(
          (sum, a) => sum + Number(a.price),
          0,
        );
        const unitPrice = Number(item.product.price) + addonsTotal;

        return {
          ...item,
          quantity: newQty,
          totalPrice: unitPrice * newQty,
        };
      }
      return item;
    });
    set({ items });
  },

  clearCart: () => set({ items: [] }),

  totalAmount: () => {
    return get().items.reduce((sum, item) => sum + item.totalPrice, 0);
  },

  totalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
