import React, { useState } from "react";
import { Home, Grid, ShoppingCart, User, MoreHorizontal, X, Tag, PhoneCall, Heart, MessageCircle, Send, ChevronRight, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";

import { useAdmin } from "../context/AdminContext";

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { t, language } = useSettings();
  const { contactInfo } = useAdmin();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const navItems = [
    { name: t("home"), path: "/", icon: <Home size={20} /> },
    { name: t("categories"), path: "/categories", icon: <Grid size={20} /> },
    { name: t("cart"), path: "/cart", icon: <ShoppingCart size={20} />, badge: cartCount },
    { name: t("profile"), path: "/profile", icon: <User size={20} /> },
  ];

  const moreMenuItems = [
    { name: t("offers"), path: "/#offers", icon: <Tag size={18} /> },
    { name: t("contact"), path: "/contact", icon: <PhoneCall size={18} /> },
    { name: language === 'bn' ? 'উইশলিস্ট' : 'Wishlist', path: "/profile", icon: <Heart size={18} /> },
    { name: language === 'bn' ? 'এডমিন পোর্টাল' : 'Admin Portal', path: "/admin", icon: <ShieldCheck size={18} /> },
  ];

  const waNumber = (contactInfo.whatsappNumber || contactInfo.phone || "").replace(/[^0-9]/g, "");

  const contactOptions = [
    { name: "WhatsApp", icon: <MessageCircle size={20} className="text-green-500" />, link: `https://wa.me/${waNumber.startsWith('88') ? waNumber : '88' + waNumber}` },
    { name: "Telegram", icon: <Send size={20} className="text-sky-500" />, link: contactInfo.telegramLink || "#" },
    { name: language === 'bn' ? 'কল করুন' : 'Call Now', icon: <PhoneCall size={20} className="text-primary" />, link: `tel:${contactInfo.phone}` },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 z-50 lg:hidden px-2 pb-safe font-sans">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`flex flex-col items-center justify-center w-full transition-colors ${
                  isActive ? "text-primary" : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-neutral-900 px-0.5 animate-in zoom-in duration-300">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 font-bold">{item.name}</span>
              </button>
            );
          })}
          
          {/* 3 Dot More Button */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className="flex flex-col items-center justify-center w-full text-neutral-500 dark:text-neutral-400"
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] mt-1 font-bold">{language === 'bn' ? 'আরও' : 'More'}</span>
          </button>
        </div>
      </nav>

      {/* More Menu Overlay (The Full Menu) */}
      <AnimatePresence>
        {isMoreMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 z-[101] rounded-t-[2.5rem] p-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-display font-black text-neutral-900 dark:text-white">
                  {language === 'bn' ? 'এক্সপ্লোর করুন' : 'Explore Menu'}
                </h3>
                <button
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="bg-neutral-100 dark:bg-neutral-800 p-2.5 rounded-full text-neutral-500 hover:text-primary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {moreMenuItems.map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.path}
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-transparent hover:border-primary/20 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center text-primary shadow-sm">
                      {item.icon}
                    </div>
                    <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{item.name}</span>
                  </Link>
                ))}
              </div>

              <div>
                <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest mb-4">
                  {language === 'bn' ? 'সাপোর্ট' : 'Support'}
                </h4>
                <div className="flex flex-wrap gap-4">
                  {contactOptions.map((opt, idx) => (
                    <a
                      key={idx}
                      href={opt.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 font-bold text-sm text-neutral-700 dark:text-neutral-300 hover:text-primary transition-colors"
                    >
                      {opt.icon}
                      {opt.name}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
