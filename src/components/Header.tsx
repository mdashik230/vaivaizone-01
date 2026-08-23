import { Search, ShoppingCart, User, Menu, X, Home, Grid, Tag, PhoneCall, ChevronRight, ArrowLeft, MessageCircle, Send } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Product } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useSettings } from "../context/SettingsContext";
import { useCart } from "../context/CartContext";
import { useAdmin } from "../context/AdminContext";

export default function Header() {
  const { language, theme, t } = useSettings();
  const { cartCount, wishlistCount } = useCart();
  const { products, categories, contactInfo } = useAdmin();
  const [isSticky, setIsSticky] = useState(false);
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const isSearchHidden = ["/profile", "/cart", "/checkout", "/contact"].includes(location.pathname);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<"main" | "categories" | "contact">("main");
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle outside click to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMenuOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 0) {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8); // Limit results to 8
      setSearchResults(filtered);
      setShowResults(true);
    } else {
      // When empty, show some featured products as recommendations
      setSearchResults(products.slice(0, 4));
      setShowResults(true);
    }
  };

  const handleSearchFocus = () => {
    if (searchQuery.length === 0) {
      setSearchResults(products.slice(0, 4));
    }
    setShowResults(true);
  };

  const menuItems = [
    { id: "home", name: t("home"), path: "/", icon: <Home size={20} /> },
    { id: "categories", name: t("categories"), path: "/categories", icon: <Grid size={20} /> },
    { id: "offers", name: t("offers"), path: "/#offers", icon: <Tag size={20} /> },
    { id: "profile", name: t("profile"), path: "/profile", icon: <User size={20} /> },
    { id: "contact", name: t("contact"), path: "/contact", icon: <PhoneCall size={20} /> },
  ];

  const waNumber = (contactInfo.whatsappNumber || contactInfo.phone || "").replace(/[^0-9]/g, "");

  const contactOptions = [
    { name: "WhatsApp", value: contactInfo.whatsappNumber || contactInfo.phone, icon: <MessageCircle size={20} className="text-green-500" />, color: "bg-green-50 dark:bg-green-950/30", link: `https://wa.me/${waNumber.startsWith('88') ? waNumber : '88' + waNumber}` },
    { name: "IMO", value: contactInfo.phone, icon: <PhoneCall size={20} className="text-blue-500" />, color: "bg-blue-50 dark:bg-blue-950/30", link: `tel:${contactInfo.phone}` },
    { name: "Telegram", value: contactInfo.telegramLink ? "@" + contactInfo.telegramLink.split('/').pop() : "@channel", icon: <Send size={20} className="text-sky-500" />, color: "bg-sky-50 dark:bg-sky-950/30", link: contactInfo.telegramLink || "#" },
    { name: language === 'bn' ? 'সরাসরি কল' : 'Direct Call', value: contactInfo.phone, icon: <PhoneCall size={20} className="text-primary" />, color: "bg-primary/5 dark:bg-primary/10", link: `tel:${contactInfo.phone}` },
  ];

  const handleMenuClick = (item: any) => {
    if (item.id === "categories") {
      setActiveMenu("categories");
      return;
    }
    
    if (item.id === "contact") {
      setActiveMenu("contact");
      return;
    }

    setIsMenuOpen(false);
    setActiveMenu("main");
    if (item.path.startsWith("/#")) {
      const id = item.path.split("#")[1];
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/");
      }
    } else {
      navigate(item.path);
    }
  };

  return (
    <header 
      className={`w-full z-50 sticky top-0 transition-all duration-300 ${
        isSticky 
          ? "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md shadow-sm py-3" 
          : "bg-white dark:bg-neutral-950 py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between gap-4">
        {/* Mobile Menu Icon - Hidden on mobile, handled by bottom nav */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="hidden lg:flex text-neutral-600 dark:text-neutral-400 p-1 hover:text-primary transition-colors" 
          id="mobile-menu-btn"
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        <div className="flex-shrink-0">
          <Link to="/">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-primary tracking-tighter">
              Vai Vai<span className="text-neutral-900 dark:text-white transition-colors"> Zone</span>
            </h1>
          </Link>
        </div>

        {/* Search Bar - Desktop & Tablet */}
        {!isSearchHidden && (
          <div className="hidden md:flex flex-grow max-w-xl relative" ref={searchRef}>
            <div className="w-full relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                placeholder={t("search_placeholder")} 
                className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-full py-2.5 pl-12 pr-10 focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-sm dark:text-neutral-100"
                id="desktop-search"
              />
              {searchQuery && (
                <button 
                  onClick={() => {setSearchQuery(""); setShowResults(false);}} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div 
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden z-[60]"
              >
                <div className="p-3 border-b border-neutral-50 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">
                    {searchQuery.length > 0 ? t("searching") : (language === 'bn' ? 'আপনার জন্য কিছু প্রডাক্ট' : 'Recommended For You')}
                  </span>
                </div>
                <div className="py-1">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      onClick={() => {
                        setSearchQuery("");
                        setShowResults(false);
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-100 dark:border-neutral-800">
                        <img src={product.image || undefined} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h4>
                        <p className="text-[10px] text-neutral-400">{product.category} • <span className="text-primary font-bold">৳{product.price}</span></p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Icons - Tablet/Desktop Only */}
        <div className="hidden md:flex items-center gap-3 md:gap-6">
          <Link to="/profile" className="relative group flex flex-col items-center text-neutral-600 dark:text-neutral-400 hover:text-primary transition-colors">
            <div className="relative">
              <User size={22} />
            </div>
            <span className="hidden sm:block text-[10px] font-medium uppercase mt-0.5">{language === 'bn' ? 'প্রোফাইল' : 'Profile'}</span>
          </Link>
          
          <Link to="/cart" className="flex flex-col items-center text-neutral-600 dark:text-neutral-400 hover:text-primary transition-colors relative group">
            <div className="relative group-hover:scale-110 transition-transform">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold min-w-4 h-4 px-1 flex items-center justify-center rounded-full border-2 border-white dark:border-neutral-900 animate-in zoom-in duration-300">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:block text-[10px] font-medium uppercase mt-0.5">{t("cart")}</span>
          </Link>
        </div>
      </div>

      {/* Mobile Search - Only shows on mobile */}
      {!isSearchHidden && (
        <div className="md:hidden px-4 pb-4">
          <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
              <Search size={16} />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              placeholder={t("search_placeholder")} 
              className="w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-2xl py-2.5 pl-10 pr-10 outline-none text-sm dark:text-neutral-100 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => {setSearchQuery(""); setShowResults(false);}} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 p-1"
              >
                <X size={14} />
              </button>
            )}

            {/* Mobile Search Results */}
            {showResults && searchResults.length > 0 && (
              <div 
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden z-[60]"
              >
                <div className="p-3 border-b border-neutral-50 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">
                    {searchQuery.length > 0 ? t("searching") : (language === 'bn' ? 'আপনার জন্য কিছু প্রডাক্ট' : 'Recommended For You')}
                  </span>
                </div>
                <div className="py-1">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      onClick={() => {
                        setSearchQuery("");
                        setShowResults(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
                    >
                      <img src={product.image || undefined} alt="" className="w-8 h-8 rounded-md object-cover" />
                      <div>
                        <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-xs line-clamp-1">{product.name}</h4>
                        <p className="text-[10px] text-neutral-500">৳{product.price}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white dark:bg-neutral-900 z-[101] shadow-2xl flex flex-col transition-colors"
            >
              <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <Link to="/" onClick={() => setIsMenuOpen(false)}>
                  <h1 className="text-2xl font-display font-bold text-primary tracking-tighter">
                    Vai Vai<span className="text-neutral-900 dark:text-white transition-colors"> Zone</span>
                  </h1>
                </Link>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-full text-neutral-500 dark:text-neutral-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto py-6">
                <div className="px-6 mb-8">
                  <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest mb-4">{language === 'bn' ? 'মেনু নেভিগেশন' : 'Navigation Menu'}</p>
                  <nav className="space-y-2">
                    {activeMenu === "main" ? (
                      menuItems.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleMenuClick(item)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-primary hover:text-white transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-neutral-400 group-hover:text-white transition-colors">
                              {item.icon}
                            </span>
                            <span className="font-bold text-lg dark:text-neutral-200 group-hover:text-white">{item.name}</span>
                          </div>
                          <ChevronRight size={18} className="text-neutral-300 group-hover:text-white transition-colors" />
                        </button>
                      ))
                    ) : activeMenu === "categories" ? (
                      <div className="space-y-3">
                        <button 
                          onClick={() => setActiveMenu("main")}
                          className="flex items-center gap-2 text-primary font-bold mb-4 px-2"
                        >
                          <ArrowLeft size={18} />
                          <span>{t("back_to_menu")}</span>
                        </button>
                        {Object.entries(categories).map(([id, category]: [string, any]) => (
                          <Link
                            key={id}
                            to={`/category/${id}`}
                            onClick={() => {setIsMenuOpen(false); setActiveMenu("main");}}
                            className="flex items-center gap-4 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                          >
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-100 dark:border-neutral-800">
                              <img src={category.image || "https://images.unsplash.com/photo-1546054452-963030310217?auto=format&fit=crop&q=80&w=1200"} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-grow">
                              <h4 className="font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary transition-colors">{category.name}</h4>
                              <p className="text-[10px] text-neutral-400">{t("view_all")}</p>
                            </div>
                            <ChevronRight size={16} className="text-neutral-300 group-hover:text-primary transition-colors" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button 
                          onClick={() => setActiveMenu("main")}
                          className="flex items-center gap-2 text-primary font-bold mb-4 px-2"
                        >
                          <ArrowLeft size={18} />
                          <span>{t("back_to_menu")}</span>
                        </button>
                        <div className="grid grid-cols-1 gap-3">
                          {contactOptions.map((opt, idx) => (
                            <a
                              key={idx}
                              href={opt.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`w-full flex items-center justify-between p-4 rounded-2xl ${opt.color} border border-transparent hover:border-primary/20 transition-all`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-xl shadow-sm">
                                  {opt.icon}
                                </div>
                                <div className="text-left">
                                  <p className="font-bold text-neutral-800 dark:text-neutral-200">{opt.name}</p>
                                  <p className="text-xs text-neutral-500 font-mono italic">{opt.value}</p>
                                </div>
                              </div>
                              <ChevronRight size={18} className="text-neutral-300" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </nav>
                </div>

                <div className="px-6">
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                      <h4 className="font-black text-xl text-primary mb-1">{t("membership_title")}</h4>
                      <p className="text-xs text-primary/70 mb-4">{t("membership_desc")}</p>
                      <button className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg shadow-primary/20">
                        {t("join_now")}
                      </button>
                    </div>
                    <Tag className="absolute -right-4 -bottom-4 text-primary/10 rotate-12" size={100} />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center gap-4">
                <p className="text-xs text-neutral-400 dark:text-neutral-500">© ২০২৪ Vai Vai Zone | {t("all_rights")}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
