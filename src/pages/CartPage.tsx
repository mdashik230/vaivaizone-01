import React from "react";
import { ShoppingBag, Trash2, ChevronLeft, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";

export default function CartPage() {
  const { cart, removeFromCart, cartCount } = useCart();
  const { language, t } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();

  const subtotal = cart.reduce((acc, item) => {
    const itemPrice = Number(item.price) || 0;
    return acc + (itemPrice * item.quantity);
  }, 0);
  const deliveryFee = 60;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen flex flex-col font-sans dark:bg-neutral-950 transition-colors">
      <Header />
      <main className="flex-grow py-8 pb-28 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate(-1)} aria-label="Go back" className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white">
              {t("cart")}
            </h1>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-[3rem] border border-dashed border-neutral-200 dark:border-neutral-800">
              <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6 text-neutral-400">
                <ShoppingBag size={40} />
              </div>
              <p className="text-xl font-bold text-neutral-500 mb-6">
                {language === 'bn' ? "আপনার কার্ট খালি" : "Your cart is empty"}
              </p>
              <Link to="/" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform">
                {language === 'bn' ? "কেনাকাটা শুরু করুন" : "Start Shopping"}
                <ArrowRight size={20} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items List */}
              <div className="lg:col-span-2 space-y-4">
                {cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-neutral-800 dark:text-white mb-1">{item.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.selectedSize && <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full font-bold uppercase">{item.selectedSize}</span>}
                        {item.selectedColor && <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full font-bold uppercase">{item.selectedColor}</span>}
                        {item.selectedWeight && <span className="text-[10px] bg-green-100 dark:bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase">{item.selectedWeight}</span>}
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">Qty: {item.quantity}</span>
                      </div>
                      <p className="text-primary font-black">৳{item.price * item.quantity}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name} from cart`}
                      className="p-3 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-xl sticky top-24">
                  <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-6">Order Summary</h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                      <span>Subtotal</span>
                      <span className="font-bold text-neutral-800 dark:text-white">৳{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                      <span>Delivery Fee</span>
                      <span className="font-bold text-neutral-800 dark:text-white">৳{deliveryFee}</span>
                    </div>
                    <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
                    <div className="flex justify-between text-xl font-black text-primary">
                      <span>Total</span>
                      <span>৳{total}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (user) {
                        navigate("/checkout");
                      } else {
                        navigate("/login?redirect=/checkout");
                      }
                    }}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-center"
                  >
                    {user ? (language === 'bn' ? "অর্ডার সম্পন্ন করুন" : "Checkout Now") : (language === 'bn' ? "লগইন করে অর্ডার করুন" : "Login to Checkout")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
