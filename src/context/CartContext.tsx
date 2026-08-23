import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Heart } from "lucide-react";
import { useSettings } from "./SettingsContext";
import { useAuth } from "./AuthContext";
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedWeight?: string;
}

interface CartContextType {
  cart: CartItem[];
  wishlist: string[]; // array of product IDs
  addToCart: (product: Product, quantity: number, options?: any) => void;
  removeFromCart: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  cartCount: number;
  wishlistCount: number;
  clearCart: () => void;
  toast: {message: string, show: boolean, type: 'cart' | 'wishlist'};
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { language } = useSettings();
  const { user } = useAuth();

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          ...item,
          id: String(item.id)
        }));
      }
      return [];
    } catch (e) {
      console.error("Error loading cart from storage", e);
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("wishlist");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.map(id => String(id));
      return [];
    } catch (e) {
      return [];
    }
  });

  // Sync wishlist with Firestore if user is logged in
  useEffect(() => {
    if (!user) {
      // Load from local storage for guests
      const saved = localStorage.getItem("wishlist");
      if (saved) {
        try { setWishlist(JSON.parse(saved)); } catch (e) {}
      }
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data();
        if (userData.wishlist) {
          setWishlist(userData.wishlist);
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));

    return () => unsubscribe();
  }, [user]);

  // Save guest wishlist to local storage
  useEffect(() => {
    if (!user) {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const [toast, setToast] = useState<{message: string, show: boolean, type: 'cart' | 'wishlist'}>({ message: '', show: false, type: 'cart' });

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const addToCart = (product: Product, quantity: number, options?: any) => {
    if (!product || !product.id) {
      console.error("Invalid product added to cart", product);
      return;
    }

    const prodId = String(product.id);

    // Normalize options
    const normalizedOptions = {
      size: options?.size || undefined,
      color: options?.color || undefined,
      weight: options?.weight || undefined
    };

    setCart((prev) => {
      const existingItemIndex = prev.findIndex(
        (item) => 
          String(item.id) === prodId && 
          (item.selectedSize === normalizedOptions.size || (!item.selectedSize && !normalizedOptions.size)) && 
          (item.selectedColor === normalizedOptions.color || (!item.selectedColor && !normalizedOptions.color)) &&
          (item.selectedWeight === normalizedOptions.weight || (!item.selectedWeight && !normalizedOptions.weight))
      );

      if (existingItemIndex > -1) {
        const newCart = [...prev];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + quantity
        };
        return newCart;
      }

      return [
        ...prev,
        {
          ...product,
          id: prodId,
          quantity,
          selectedSize: normalizedOptions.size,
          selectedColor: normalizedOptions.color,
          selectedWeight: normalizedOptions.weight,
        },
      ];
    });
    
    // Show user feedback
    const msg = language === 'bn' 
      ? `"${product.name}" কার্টে যোগ করা হয়েছে`
      : `"${product.name}" added to cart`;
    
    setToast({ message: msg, show: true, type: 'cart' });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => String(item.id) !== String(productId)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = async (id: string) => {
    const productId = String(id);
    const isAdding = !wishlist.includes(productId);
    const newWishlist = isAdding 
      ? [...wishlist, productId]
      : wishlist.filter(id => String(id) !== productId);
    
    setWishlist(newWishlist);

    // Show feedback
    const msg = isAdding 
      ? (language === 'bn' ? "উইশলিস্টে যোগ করা হয়েছে" : "Added to wishlist")
      : (language === 'bn' ? "উইশলিস্ট থেকে সরানো হয়েছে" : "Removed from wishlist");
    
    setToast({ message: msg, show: true, type: 'wishlist' });

    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), { wishlist: newWishlist });
      } catch (error) {
        console.error("Error updating wishlist in Firestore", error);
      }
    }
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  return (
    <CartContext.Provider value={{ 
      cart, 
      wishlist, 
      addToCart, 
      removeFromCart, 
      toggleWishlist, 
      cartCount, 
      wishlistCount,
      clearCart,
      toast
    }}>
      {children}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[9999] bg-neutral-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[280px]"
          >
            <div className="bg-primary/20 p-2 rounded-full">
              {toast.type === 'cart' ? (
                <ShoppingCart size={18} className="text-primary" />
              ) : (
                <Heart size={18} className="text-primary fill-primary" />
              )}
            </div>
            <span className="font-bold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
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
