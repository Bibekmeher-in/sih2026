"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { MarketProduct } from "@/config/demo-products";

export interface CartItem {
  productId: string;
  name: string;
  variety?: string;
  price: number;
  unit: string;
  quantity: number;
  minimumOrderQuantity: number;
  availableQuantity: number;
  sellerName: string;
  sellerType: string;
  qualityGrade: string;
}

export interface ServerCartSummary {
  valid: boolean;
  subtotal: number;
  deliveryFee: number;
  total: number;
  errors: string[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: MarketProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  serverSummary: ServerCartSummary;
  isValidating: boolean;
  refreshValidation: () => Promise<void>;
  isMounted: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [serverSummary, setServerSummary] = useState<ServerCartSummary>({
    valid: true,
    subtotal: 0,
    deliveryFee: 0,
    total: 0,
    errors: [],
  });

  // Hydrate cart from localStorage strictly after client mount to prevent SSR mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kisandirect_cart");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage read errors
    }
    setIsMounted(true);
  }, []);

  // Save cart to localStorage only after mounted
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem("kisandirect_cart", JSON.stringify(items));
    } catch {
      // Ignore localStorage errors
    }
  }, [items, isMounted]);

  // Synchronize and validate with server
  const refreshValidation = useCallback(async () => {
    if (items.length === 0) {
      setServerSummary({
        valid: true,
        subtotal: 0,
        deliveryFee: 0,
        total: 0,
        errors: [],
      });
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setServerSummary({
          valid: data.valid,
          subtotal: data.subtotal,
          deliveryFee: data.deliveryFee,
          total: data.total,
          errors: data.errors || [],
        });
      }
    } catch {
      // Fallback local subtotal calculation if network is temporarily down
      const subtotal = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
      setServerSummary({
        valid: true,
        subtotal,
        deliveryFee: subtotal > 20000 ? 0 : 150,
        total: subtotal + (subtotal > 20000 ? 0 : 150),
        errors: [],
      });
    } finally {
      setIsValidating(false);
    }
  }, [items]);

  useEffect(() => {
    refreshValidation();
  }, [refreshValidation]);

  const addItem = (product: MarketProduct, customQuantity?: number) => {
    const qtyToAdd = customQuantity || product.minimumOrderQuantity || 1;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product._id
            ? { ...i, quantity: Math.min(product.availableQuantity, i.quantity + qtyToAdd) }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          variety: product.variety,
          price: product.price,
          unit: product.unit,
          quantity: qtyToAdd,
          minimumOrderQuantity: product.minimumOrderQuantity || 1,
          availableQuantity: product.availableQuantity,
          sellerName: product.sellerName,
          sellerType: product.sellerType,
          qualityGrade: product.qualityGrade,
        },
      ];
    });

    setDrawerOpen(true);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount: isMounted ? items.length : 0,
        isDrawerOpen,
        setDrawerOpen,
        serverSummary,
        isValidating,
        refreshValidation,
        isMounted,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
