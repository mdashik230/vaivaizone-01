import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, ShoppingBag, Star, Filter } from "lucide-react";
import Header from "../components/Header";
import { useCart } from "../context/CartContext";
import { useAdmin } from "../context/AdminContext";

export default function SubCategoryPage() {
  const { categoryId, subCategoryName } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products, categories } = useAdmin();

  // Find subcategory object for image
  const category = categoryId ? categories[categoryId] : null;
  const subCategory = category?.subcategories?.find(
    (s: any) => s.name.toLowerCase().replace(/ /g, '-') === subCategoryName?.toLowerCase()
  );

  // Filter products by subcategory name
  const filteredProducts = products.filter(p => {
    const subName = subCategoryName?.toLowerCase() || "";
    const subCat = (p as any).subCategory?.toLowerCase() || "";
    
    return subCat.replace(/ /g, '-') === subName || subCat === subName.replace(/-/g, ' ');
  });

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow bg-neutral-50 dark:bg-neutral-950 pb-28 md:pb-16 transition-colors">
        {/* Banner/Header */}
        {subCategory?.image ? (
          <div className="relative h-[200px] md:h-[300px] overflow-hidden">
            <img 
              src={subCategory.image} 
              alt={subCategory.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white px-4">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl md:text-5xl font-display font-black text-center uppercase tracking-tighter"
              >
                {subCategory.name}
              </motion.h1>
              <p className="mt-2 text-sm font-bold opacity-80 uppercase tracking-widest">{filteredProducts.length} Items</p>
            </div>
            <button 
              onClick={() => navigate(-1)} 
              className="absolute top-6 left-6 z-20 bg-white/20 hover:bg-primary backdrop-blur-md text-white p-2.5 rounded-full transition-all shadow-lg active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 py-8 md:py-12 transition-colors">
            <div className="container mx-auto px-4">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-primary transition-colors mb-6 group"
              >
                <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-full group-hover:bg-primary/10 transition-all">
                  <ChevronLeft size={20} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Back</span>
              </button>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl md:text-5xl font-display font-black text-neutral-900 dark:text-white capitalize tracking-tighter">
                    {subCategory?.name || subCategoryName?.replace(/-/g, ' ')}
                  </h1>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-bold uppercase text-xs tracking-widest">
                    {filteredProducts.length} Premium items in stock
                  </p>
                </div>
                <button className="flex items-center gap-3 bg-primary text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  <Filter size={16} />
                  Filter & Sort
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {filteredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <Link to={`/product/${product.id}`} className="block">
                        <div className="aspect-square overflow-hidden relative border-b border-neutral-100 dark:border-neutral-800">
                          <img 
                            src={product.image || undefined} 
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-4 md:p-5">
                          <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => <Star key={`star-${product.id}-${i}`} size={10} fill="currentColor" />)}
                            </div>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">(2)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                {product.originalPrice && product.originalPrice > product.price ? (
                                  <>
                                    <span className="text-[10px] text-neutral-400 line-through font-medium">৳{product.originalPrice}</span>
                                    <span className="text-base md:text-lg font-black text-primary">৳{product.price}</span>
                                  </>
                                ) : (
                                  <span className="text-base md:text-lg font-black text-primary">৳{product.price}</span>
                                )}
                              </div>
                              {product.discount && product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">
                                  {product.discount} OFF
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                addToCart(product, 1);
                              }} 
                              className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 p-2 rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90"
                            >
                              <ShoppingBag size={18} />
                            </button>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <ShoppingBag size={64} className="mx-auto text-neutral-200 mb-4" />
                <h3 className="text-xl font-bold text-neutral-400">No products found for this subcategory yet.</h3>
                <p className="text-neutral-500 mt-2">আমরা শীঘ্রই আরও নতুন পণ্য যোগ করছি!</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
