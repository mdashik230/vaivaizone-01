import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, ShoppingBag, Star, Filter, ArrowUpDown, ChevronRight } from "lucide-react";
import Header from "../components/Header";
import { useCart } from "../context/CartContext";
import { useAdmin } from "../context/AdminContext";

export default function SubCategoryPage() {
  const { categoryId, subCategoryName } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products, categories } = useAdmin();
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Find category object
  const category = categoryId ? (
    categories[categoryId] || 
    Object.values(categories).find(c => 
      c.id === categoryId || 
      c.id?.toLowerCase() === categoryId.toLowerCase() ||
      c.name?.toLowerCase() === categoryId.toLowerCase() ||
      c.name?.toLowerCase().replace(/\s+/g, '-') === categoryId.toLowerCase()
    )
  ) : null;

  // Resolve subcategory parameter (handle URL encoding, spaces, slugification)
  const decodedSubParam = decodeURIComponent(subCategoryName || "").trim().toLowerCase();
  const slugifiedSubParam = decodedSubParam.replace(/\s+/g, '-');

  // Find subcategory object for image and title
  const subCategory = category?.subcategories?.find((s: any) => {
    if (!s) return false;
    const sId = (s.id || '').trim().toLowerCase();
    const sName = (s.name || '').trim().toLowerCase();
    const sSlug = sName.replace(/\s+/g, '-');
    return (
      sId === decodedSubParam ||
      sId === slugifiedSubParam ||
      sId === subCategoryName?.toLowerCase() ||
      sName === decodedSubParam ||
      sSlug === slugifiedSubParam ||
      sSlug === subCategoryName?.toLowerCase() ||
      sName.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '') === slugifiedSubParam.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '')
    );
  });

  const displayName = subCategory?.name || decodeURIComponent(subCategoryName || "").replace(/-/g, ' ');

  // Filter products by subcategory and category
  const filteredProducts = useMemo(() => {
    const list = products.filter(p => {
      // 1. Check category match if category is resolved
      if (category) {
        const pCat = (p.category || "").trim().toLowerCase();
        const catKey = (categoryId || "").trim().toLowerCase();
        const catId = (category.id || "").trim().toLowerCase();
        const catName = (category.name || "").trim().toLowerCase();
        const catSlug = catName.replace(/\s+/g, '-');

        const matchesCat = 
          !p.category || 
          pCat === catKey || 
          pCat === catId || 
          pCat === catName || 
          pCat === catSlug ||
          pCat.replace(/\s+/g, '-') === catSlug;
        
        if (!matchesCat) return false;
      }

      // 2. Check subcategory match
      const pSub = ((p as any).subCategory || "").trim();
      if (!pSub) return false;

      const pSubLower = pSub.toLowerCase();
      const pSubSlug = pSubLower.replace(/\s+/g, '-');

      if (subCategory) {
        const sId = (subCategory.id || "").trim().toLowerCase();
        const sName = (subCategory.name || "").trim().toLowerCase();
        const sSlug = sName.replace(/\s+/g, '-');

        if (
          (sId && pSubLower === sId) ||
          (sName && pSubLower === sName) ||
          (sSlug && pSubSlug === sSlug) ||
          (sName && pSubLower.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '') === sName.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, ''))
        ) {
          return true;
        }
      }

      return (
        pSubLower === decodedSubParam ||
        pSubSlug === slugifiedSubParam ||
        pSubSlug === subCategoryName?.toLowerCase() ||
        pSubLower === subCategoryName?.toLowerCase() ||
        pSubLower.replace(/ /g, '-') === (subCategoryName?.toLowerCase() || "") ||
        pSubLower === (subCategoryName?.toLowerCase() || "").replace(/-/g, ' ') ||
        pSubLower.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '') === slugifiedSubParam.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '')
      );
    });

    if (sortBy === "price-asc") {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === "price-desc") {
      return [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, category, categoryId, subCategory, decodedSubParam, slugifiedSubParam, subCategoryName, sortBy]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow bg-neutral-50 dark:bg-neutral-950 pb-28 md:pb-16 transition-colors">
        {/* Banner/Header */}
        {subCategory?.image ? (
          <div className="relative h-[220px] md:h-[320px] overflow-hidden">
            <img 
              src={subCategory.image} 
              alt={displayName} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 flex flex-col items-center justify-center text-white px-4">
              {/* Breadcrumb in Banner */}
              <div className="flex items-center gap-1.5 text-xs text-white/80 font-bold mb-2">
                <Link to="/" className="hover:text-primary transition-colors">হোম</Link>
                <ChevronRight size={14} />
                {category && (
                  <>
                    <Link to={`/category/${categoryId}`} className="hover:text-primary transition-colors">{category.name}</Link>
                    <ChevronRight size={14} />
                  </>
                )}
                <span className="text-primary">{displayName}</span>
              </div>
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl md:text-5xl font-display font-black text-center capitalize tracking-tighter"
              >
                {displayName}
              </motion.h1>
              <p className="mt-2 text-xs md:text-sm font-bold opacity-90 uppercase tracking-widest">{filteredProducts.length} টি পণ্য পাওয়া গেছে</p>
            </div>
            <button 
              onClick={() => navigate(-1)} 
              className="absolute top-6 left-6 z-20 bg-white/20 hover:bg-primary backdrop-blur-md text-white p-2.5 rounded-full transition-all shadow-lg active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 py-8 md:py-10 transition-colors">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-2 mb-4">
                <button 
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 hover:text-primary transition-colors group"
                >
                  <div className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full group-hover:bg-primary/10 transition-all">
                    <ChevronLeft size={18} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider">পিছনে</span>
                </button>
                <span className="text-neutral-300 dark:text-neutral-700">|</span>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-bold truncate">
                  <Link to="/" className="hover:text-primary transition-colors">হোম</Link>
                  <ChevronRight size={14} />
                  {category && (
                    <>
                      <Link to={`/category/${categoryId}`} className="hover:text-primary transition-colors">{category.name}</Link>
                      <ChevronRight size={14} />
                    </>
                  )}
                  <span className="text-primary font-black truncate">{displayName}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-black text-neutral-900 dark:text-white capitalize tracking-tighter">
                    {displayName}
                  </h1>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-1 font-bold text-xs tracking-wider">
                    {filteredProducts.length} টি পণ্য স্টকে রয়েছে
                  </p>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                  >
                    <ArrowUpDown size={15} />
                    <span>
                      {sortBy === "price-asc" ? "দাম: কম থেকে বেশি" : sortBy === "price-desc" ? "দাম: বেশি থেকে কম" : "ফিল্টার ও সাজান"}
                    </span>
                  </button>

                  {showSortDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800 py-2 z-30">
                      <button 
                        onClick={() => { setSortBy("default"); setShowSortDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold ${sortBy === 'default' ? 'text-primary bg-primary/5' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                      >
                        ডিফল্ট (সবগুলো)
                      </button>
                      <button 
                        onClick={() => { setSortBy("price-asc"); setShowSortDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold ${sortBy === 'price-asc' ? 'text-primary bg-primary/5' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                      >
                        দাম: কম থেকে বেশি
                      </button>
                      <button 
                        onClick={() => { setSortBy("price-desc"); setShowSortDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold ${sortBy === 'price-desc' ? 'text-primary bg-primary/5' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                      >
                        দাম: বেশি থেকে কম
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {filteredProducts.map((product) => (
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
              <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 p-8 max-w-lg mx-auto">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag size={36} />
                </div>
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">এই সাব-ক্যাটাগরিতে এখনও কোনো প্রডাক্ট পাওয়া যায়নি</h3>
                <p className="text-neutral-500 text-xs mt-2 leading-relaxed">
                  আমরা খুব শীঘ্রই এই সাব-ক্যাটাগরিতে নতুন ও আকর্ষণীয় সব পণ্য যুক্ত করব।
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  {category && (
                    <Link 
                      to={`/category/${categoryId}`}
                      className="px-5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 rounded-xl font-bold text-xs transition-colors"
                    >
                      {category.name} ক্যাটাগরি দেখুন
                    </Link>
                  )}
                  <Link 
                    to="/products"
                    className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    সব পণ্য ব্রাউজ করুন
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
