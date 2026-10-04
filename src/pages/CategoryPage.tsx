import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, Smartphone, Shirt, ShoppingBasket, ShoppingBag, Star, ChevronRight, Filter } from "lucide-react";
import React from "react";
import Header from "../components/Header";
import { useAdmin } from "../context/AdminContext";
import { useCart } from "../context/CartContext";

const iconMap: Record<string, React.ReactNode> = {
  "gadgets-accessories": <Smartphone size={40} className="text-blue-500" />,
  "fashion-lifestyle": <Shirt size={40} className="text-pink-500" />,
  "groceries-fresh-food": <ShoppingBasket size={40} className="text-green-500" />
};

const DefaultIcon = () => (
  <ShoppingBag size={40} className="text-primary" />
);

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { products, categories } = useAdmin();
  const { addToCart } = useCart();
  const [selectedSubTab, setSelectedSubTab] = useState<string>("all");

  // Find category object robustly
  const category = categoryId ? (
    categories[categoryId] || 
    Object.values(categories).find(c => 
      c.id === categoryId || 
      c.id?.toLowerCase() === categoryId.toLowerCase() ||
      c.name?.toLowerCase() === categoryId.toLowerCase() ||
      c.name?.toLowerCase().replace(/\s+/g, '-') === categoryId.toLowerCase()
    )
  ) : null;

  // Accurate product count for a given subcategory
  const getProductCount = (sub: any) => {
    const sId = (sub?.id || "").trim().toLowerCase();
    const sName = (sub?.name || (typeof sub === 'string' ? sub : '')).trim().toLowerCase();
    const sSlug = sName.replace(/\s+/g, '-');

    return products.filter(p => {
      // Must match parent category if product specifies category
      if (p.category && category) {
        const pCat = p.category.trim().toLowerCase();
        const catKey = (categoryId || "").toLowerCase();
        const catId = (category.id || "").toLowerCase();
        const catName = (category.name || "").toLowerCase();
        const matchesCat = 
          pCat === catKey || 
          pCat === catId || 
          pCat === catName || 
          pCat.replace(/\s+/g, '-') === catName.replace(/\s+/g, '-');
        if (!matchesCat) return false;
      }

      const pSub = ((p as any).subCategory || "").trim().toLowerCase();
      if (!pSub) return false;
      const pSubSlug = pSub.replace(/\s+/g, '-');

      return (
        (sId && pSub === sId) ||
        (sName && pSub === sName) ||
        (sSlug && pSubSlug === sSlug) ||
        pSub.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '') === sName.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '')
      );
    }).length;
  };

  // All products belonging to this category
  const categoryProducts = useMemo(() => {
    if (!category) return [];
    return products.filter(p => {
      const pCat = (p.category || "").trim().toLowerCase();
      const catKey = (categoryId || "").trim().toLowerCase();
      const catId = (category.id || "").trim().toLowerCase();
      const catName = (category.name || "").trim().toLowerCase();
      const catSlug = catName.replace(/\s+/g, '-');

      return (
        pCat === catKey || 
        pCat === catId || 
        pCat === catName || 
        pCat === catSlug ||
        pCat.replace(/\s+/g, '-') === catSlug
      );
    });
  }, [products, category, categoryId]);

  // Filter category products based on active tab
  const displayedProducts = useMemo(() => {
    if (selectedSubTab === "all") return categoryProducts;
    
    // Find the subcategory by id or name
    const activeSub = category?.subcategories?.find((s: any) => 
      s.id === selectedSubTab || 
      s.name?.toLowerCase() === selectedSubTab.toLowerCase() ||
      s.name?.toLowerCase().replace(/\s+/g, '-') === selectedSubTab.toLowerCase()
    );

    const sId = (activeSub?.id || "").trim().toLowerCase();
    const sName = (activeSub?.name || selectedSubTab).trim().toLowerCase();
    const sSlug = sName.replace(/\s+/g, '-');

    return categoryProducts.filter(p => {
      const pSub = ((p as any).subCategory || "").trim().toLowerCase();
      if (!pSub) return false;
      const pSubSlug = pSub.replace(/\s+/g, '-');

      return (
        (sId && pSub === sId) ||
        (sName && pSub === sName) ||
        (sSlug && pSubSlug === sSlug) ||
        pSub.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '') === sName.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '')
      );
    });
  }, [categoryProducts, selectedSubTab, category]);

  if (!category || !categoryId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950">
        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-4">
          <ShoppingBag size={32} className="text-neutral-400" />
        </div>
        <h1 className="text-2xl font-black mb-2 text-neutral-800 dark:text-neutral-200">ক্যাটাগরি পাওয়া যায়নি</h1>
        <p className="text-neutral-500 text-xs mb-6">অনুরোধকৃত ক্যাটাগরিটি খুঁজে পাওয়া যায়নি বা মুছে ফেলা হয়েছে।</p>
        <button 
          onClick={() => navigate("/")} 
          className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20"
        >
          হোম পেজে ফিরে যান
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow pb-28 md:pb-16 bg-neutral-50 dark:bg-neutral-950 transition-colors">
        {/* Banner */}
        <div className="relative h-[220px] md:h-[320px] lg:h-[380px] overflow-hidden">
          <img 
            src={category.image || "https://images.unsplash.com/photo-1546054452-963030310217?auto=format&fit=crop&q=80&w=1200"} 
            alt={category.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 flex flex-col items-center justify-center text-white px-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-white/80 font-bold mb-3">
              <Link to="/" className="hover:text-primary transition-colors">হোম</Link>
              <ChevronRight size={14} />
              <Link to="/categories" className="hover:text-primary transition-colors">ক্যাটাগরি</Link>
              <ChevronRight size={14} />
              <span className="text-primary">{category.name}</span>
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl mb-3 shadow-inner"
            >
              {iconMap[categoryId] || <DefaultIcon />}
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl md:text-5xl lg:text-6xl font-display font-black text-center tracking-tighter"
            >
              {category.name}
            </motion.h1>
            <p className="mt-2 text-xs md:text-sm font-bold opacity-90 uppercase tracking-widest">
              {categoryProducts.length} টি পণ্য উপলব্ধ
            </p>
          </div>
          
          <button 
            onClick={() => navigate(-1)} 
            className="absolute top-6 left-6 z-20 bg-white/20 hover:bg-primary backdrop-blur-md text-white p-2.5 rounded-full transition-all shadow-lg active:scale-95"
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>
        </div>

        {/* Subcategories Grid */}
        {category.subcategories && category.subcategories.length > 0 && (
          <section className="py-8 md:py-14 border-b border-neutral-100 dark:border-neutral-800">
            <div className="container mx-auto px-4">
              <div className="mb-8 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-display font-extrabold text-neutral-900 dark:text-white mb-1.5">
                  সাব-ক্যাটাগরি সমূহ (Subcategories)
                </h2>
                <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400">
                  {category.name} এর নির্দিষ্ট সাব-ক্যাটাগরি সিলেক্ট করে পণ্য ব্রাউজ করুন
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
                {category.subcategories.map((sub: any, i: number) => {
                  const count = getProductCount(sub);
                  const subSlug = (sub.name || '').trim().toLowerCase().replace(/\s+/g, '-');
                  return (
                    <Link 
                      key={sub.id || sub.name || i} 
                      to={`/category/${categoryId}/${encodeURIComponent(subSlug)}`}
                      className="block group"
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        viewport={{ once: true }}
                        className="bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[2rem] shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-neutral-100 dark:border-neutral-800 overflow-hidden"
                      >
                        <div className="aspect-[4/3] sm:aspect-square overflow-hidden relative border-b border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
                          {sub.image ? (
                            <img 
                              src={sub.image} 
                              alt={sub.name} 
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                              <ShoppingBag size={36} className="text-neutral-300 dark:text-neutral-700" />
                              <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">No Image</span>
                            </div>
                          )}
                          <div className="absolute top-2.5 right-2.5 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black text-primary shadow-xs">
                            {count} টি পণ্য
                          </div>
                        </div>
                        <div className="p-3.5 md:p-4 text-center">
                          <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-xs md:text-sm leading-tight group-hover:text-primary transition-colors capitalize">
                            {sub.name}
                          </h3>
                          <span className="text-[10px] font-bold text-neutral-400 mt-1 inline-flex items-center gap-1 group-hover:text-primary transition-colors">
                            দেখুন <ChevronRight size={12} />
                          </span>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* All Products Under This Category */}
        <section className="py-8 md:py-14">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-black text-neutral-900 dark:text-white">
                  {category.name} এর সকল পণ্য
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  মোট {displayedProducts.length} টি পণ্য দেখানো হচ্ছে
                </p>
              </div>

              {/* Subcategory Filter Tabs */}
              {category.subcategories && category.subcategories.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                  <button
                    onClick={() => setSelectedSubTab("all")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedSubTab === "all"
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100"
                    }`}
                  >
                    সবগুলো ({categoryProducts.length})
                  </button>
                  {category.subcategories.map((sub: any) => {
                    const subCount = getProductCount(sub);
                    const isSelected = selectedSubTab === (sub.name || sub.id);
                    return (
                      <button
                        key={sub.id || sub.name}
                        onClick={() => setSelectedSubTab(sub.name || sub.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          isSelected
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100"
                        }`}
                      >
                        {sub.name} ({subCount})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Products Grid */}
            {displayedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {displayedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[2rem] overflow-hidden border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <Link to={`/product/${product.id}`} className="block flex-grow">
                      <div className="aspect-square overflow-hidden relative border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
                        <img 
                          src={product.image || undefined} 
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {product.discount && product.originalPrice && product.originalPrice > product.price && (
                          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            {product.discount}
                          </span>
                        )}
                        {product.stock !== undefined && product.stock <= 0 && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full">স্টক আউট</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3.5 md:p-5">
                        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-xs md:text-sm mb-1.5 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => <Star key={`star-${product.id}-${i}`} size={11} fill="currentColor" />)}
                          </div>
                          <span className="text-[10px] text-neutral-400 font-bold">(5.0)</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base md:text-lg font-black text-primary">৳{product.price.toLocaleString('en-IN')}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-xs text-neutral-400 line-through font-medium">৳{product.originalPrice.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="p-3.5 md:p-5 pt-0">
                      <button 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          addToCart(product, 1);
                        }} 
                        disabled={product.stock !== undefined && product.stock <= 0}
                        className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 py-2.5 px-3 rounded-xl hover:bg-primary hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none active:scale-95 shadow-xs"
                      >
                        <ShoppingBag size={14} />
                        <span>কার্টে যোগ করুন</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 p-8 max-w-lg mx-auto">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag size={30} />
                </div>
                <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                  {selectedSubTab === "all" ? "এই ক্যাটাগরিতে এখনও কোনো পণ্য যোগ করা হয়নি" : "এই সাব-ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি"}
                </h3>
                <p className="text-neutral-500 text-xs mt-1.5 leading-relaxed">
                  এডমিন প্যানেল থেকে এই ক্যাটাগরি বা সাব-ক্যাটাগরিতে নতুন পণ্য যুক্ত করুন।
                </p>
                {selectedSubTab !== "all" && (
                  <button 
                    onClick={() => setSelectedSubTab("all")}
                    className="mt-4 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 rounded-xl font-bold text-xs transition-colors"
                  >
                    সকল পণ্য দেখুন
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
