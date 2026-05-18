"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string;
  name: string;
  eur: number;
  amount?: number;
  quantity: number;
  image?: string;
  cat?: string;
}

interface StockInfo {
  [productId: string]: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  stockInfo: StockInfo;
  loadingStock: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [stockInfo, setStockInfo] = useState<StockInfo>({});
  const [loadingStock, setLoadingStock] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("adex-card-cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("adex-card-cart", JSON.stringify(cart));
  }, [cart]);

  // Fetch stock info from products API
  const fetchStockInfo = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const { data } = await res.json();
        const stock: StockInfo = {};
        data?.forEach((p: any) => {
          stock[p.id] = p.stock_available || 0;
        });
        setStockInfo(stock);
      }
    } catch (error) {
      console.error("Failed to fetch stock info:", error);
    } finally {
      setLoadingStock(false);
    }
  };

  // Fetch stock on mount
  useEffect(() => {
    fetchStockInfo();
  }, []);

  // Get current quantity in cart for a product
  const getCartQuantity = (productId: string, excludeId?: string) => {
    return cart
      .filter((item) => item.id === productId && item.id !== excludeId)
      .reduce((acc, item) => acc + item.quantity, 0);
  };

  const addToCart = async (product: any): Promise<{ success: boolean; error?: string }> => {
    const productId = product.id;
    const currentQtyInCart = getCartQuantity(productId);
    const availableStock = stockInfo[productId] || 0;

    // Validate stock
    if (availableStock <= 0) {
      return { success: false, error: "Stock épuisé" };
    }

    if (currentQtyInCart >= availableStock) {
      return { success: false, error: `Stock insuffisant (${availableStock} disponible${currentQtyInCart > 0 ? `, vous en avez déjà ${currentQtyInCart} dans le panier` : ''})` };
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, {
        id: productId,
        name: product.name,
        eur: product.eur,
        amount: product.amount,
        quantity: 1,
        image: product.image,
        cat: product.cat
      }];
    });

    return { success: true };
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = async (id: string, quantity: number): Promise<{ success: boolean; error?: string }> => {
    if (quantity < 1) {
      removeFromCart(id);
      return { success: true };
    }

    const availableStock = stockInfo[id] || 0;

    if (quantity > availableStock) {
      return { success: false, error: `Stock insuffisant (max ${availableStock})` };
    }

    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id ? { ...item, quantity } : item))
    );

    return { success: true };
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.eur * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, stockInfo, loadingStock }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
