import { motion } from "motion/react";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Product } from "../types";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAdmin } from "../context/AdminContext";
import { useSettings } from "../context/SettingsContext";

export default function FeaturedProducts() {
  const { toggleWishlist, wishlist, addToCart } = useCart();
  const { products: adminProducts } = useAdmin();
  const { language } = useSettings();

  // Show top products or recently added
  const products = adminProducts.slice(0, 8);

  return (
    <section className="py-12 md:py-20 bg-neutral-50 dark:bg-neutral-900/50 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-extrabold text-neutral-900 dark:text-white mb-1 md:mb-2">
              {language === 'bn' ? 'সেরা পণ্যসমূহ' : 'Featured Products'}
            </h2>
            <p className="text-xs md:text-base text-neutral-500 dark:text-neutral-400">
              {language === 'bn' ? 'সবচেয়ে জনপ্রিয় এবং সেরা পণ্যগুলো এখানে' : 'Trending items our customers love'}
            </p>
          </div>
          <Link to="/products" className="hidden md:block font-bold text-primary hover:underline underline-offset-4">
            {language === 'bn' ? 'সব পণ্য দেখুন' : 'View All Products'}
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
              className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative"
            >
              <Link to={`/product/${product.id}`} className="block">
                {/* Product Image */}
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={product.image || undefined} 
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.isNew && (
                      <span key="badge-new" className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">New</span>
                    )}
                    {product.discount && (
                      <span key="badge-discount" className="bg-neutral-900 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">{product.discount}</span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 md:p-5">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">{product.category}</p>
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-100 mb-1 line-clamp-1 group-hover:text-primary transition-colors text-sm md:text-base">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-yellow-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={`star-${product.id}-${star}`} size={10} fill="currentColor" />
                      ))}
                    </div>
                    <span className="text-[9px] text-neutral-400">(45)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        {product.originalPrice && product.originalPrice > product.price ? (
                          <>
                            <span className="text-xs text-neutral-400 line-through font-medium">৳{product.originalPrice}</span>
                            <span className="text-base md:text-lg font-black text-primary">৳{product.price}</span>
                          </>
                        ) : (
                          <span className="text-base md:text-lg font-black text-primary">৳{product.price}</span>
                        )}
                      </div>
                      {product.discount && product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">
                          {product.discount} {language === 'bn' ? 'ছাড়' : 'OFF'}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        addToCart(product, 1);
                      }} 
                      aria-label={`অর্ডার বা কার্ট-এ যোগ করুন (${product.name})`}
                      className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 p-1.5 md:p-2 rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90"
                    >
                      <ShoppingBag size={16} />
                    </button>
                  </div>
                </div>
              </Link>
              
              {/* Quick Actions - Mobile hidden by default, shown on group hover */}
              <div className="absolute top-2 right-2 flex flex-col gap-2 transform translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                <button 
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={`উইশলিস্টে যোগ করুন (${product.name})`}
                  className={`p-1.5 rounded-full shadow-md transition-all pointer-events-auto ${
                    wishlist.includes(product.id) 
                      ? "bg-red-50 text-red-500" 
                      : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-primary"
                  }`}
                >
                  <Heart size={16} fill={wishlist.includes(product.id) ? "currentColor" : "none"} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <Link to="/products" className="block w-full mt-8 md:hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 py-4 rounded-2xl font-black text-neutral-700 dark:text-neutral-300 text-center shadow-sm">
          {language === 'bn' ? 'সব পণ্য দেখুন' : 'View All Products'}
        </Link>
      </div>
    </section>
  );
}
