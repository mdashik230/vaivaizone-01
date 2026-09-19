import React, { useState, useMemo } from 'react';
import Header from "../components/Header";
import PageTransition from "../components/PageTransition";
import { useAdmin } from "../context/AdminContext";
import { useCart } from "../context/CartContext";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Star, Search, SlidersHorizontal } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

export default function AllProductsPage() {
  const { products } = useAdmin();
  const { toggleWishlist, wishlist, addToCart } = useCart();
  const { t, language } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ["All", ...Array.from(cats)];
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 transition-colors">
        <Header />
        
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-display font-black text-neutral-900 dark:text-white mb-2">
                {language === 'bn' ? 'সব পণ্য' : 'All Products'}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                {filteredProducts.length} {language === 'bn' ? 'টি পণ্য পাওয়া গেছে' : 'products found'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                  type="text"
                  placeholder={t("search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-64"
                />
              </div>
              <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer font-bold text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300 relative"
                >
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="aspect-square relative overflow-hidden">
                      <img 
                        src={product.image || undefined} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>

                    <div className="p-4">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">{product.category}</p>
                      <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-2 line-clamp-1 group-hover:text-primary transition-colors text-sm">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            {product.originalPrice && product.originalPrice > product.price ? (
                              <>
                                <span className="text-[10px] text-neutral-400 line-through font-medium">৳{product.originalPrice}</span>
                                <span className="text-base font-black text-primary">৳{product.price}</span>
                              </>
                            ) : (
                              <span className="text-base font-black text-primary">৳{product.price}</span>
                            )}
                          </div>
                          {product.discount && product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">
                              {product.discount} {language === 'bn' ? 'ছাড়' : 'OFF'}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            addToCart(product, 1);
                          }} 
                          className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 p-2 rounded-lg hover:bg-primary hover:text-white transition-all active:scale-90"
                        >
                          <ShoppingBag size={18} />
                        </button>
                      </div>
                    </div>
                  </Link>

                  <button 
                    onClick={() => toggleWishlist(product.id)}
                    className={`absolute top-2 right-2 p-1.5 rounded-full shadow-md transition-all ${
                      wishlist.includes(product.id) 
                        ? "bg-red-50 text-red-500" 
                        : "bg-white/80 backdrop-blur-sm text-neutral-400 hover:text-red-500"
                    }`}
                  >
                    <Heart size={16} fill={wishlist.includes(product.id) ? "currentColor" : "none"} />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                <Search size={32} />
              </div>
              <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">{t("no_results")}</h2>
              <p className="text-neutral-500">{language === 'bn' ? 'অন্য কিছু লিখে পুনরায় চেষ্টা করুন' : 'Try searching for something else'}</p>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}
