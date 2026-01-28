
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (item: MenuItem, quantity?: number, notes?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  updateNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('don_louis_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to load cart", e);
      }
    }
  }, []);

  // Save cart to local storage on change
  useEffect(() => {
    localStorage.setItem('don_louis_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (item: MenuItem, quantity = 1, notes = '') => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        // If item exists, update quantity. 
        // If new notes are provided, we overwrite the old ones (simplified logic for single ID system)
        return prev.map(i => i.id === item.id ? { 
            ...i, 
            quantity: i.quantity + quantity,
            notes: notes || i.notes // Keep existing notes if new ones aren't provided
        } : i);
      }
      return [...prev, { ...item, quantity, notes }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const updateNotes = (itemId: string, notes: string) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, notes } : i));
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, updateNotes, clearCart, subtotal, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
