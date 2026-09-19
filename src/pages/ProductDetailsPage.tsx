import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ShoppingCart, Heart, Share2, Star, Minus, Plus, ShoppingBag, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Header from "../components/Header";
import { useSettings } from "../context/SettingsContext";
import { useCart } from "../context/CartContext";
import { useAdmin } from "../context/AdminContext";

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { language, t } = useSettings();
  const { addToCart, toggleWishlist, wishlist } = useCart();
  const { products, categories } = useAdmin();
  
  const product = products.find((p) => String(p.id) === String(productId));

  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedWeight, setSelectedWeight] = useState("1kg");
  const [activeTab, setActiveTab] = useState("description");
  const [isAdding, setIsAdding] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Sync main image if product changes
  useEffect(() => {
    if (product) {
      setMainImage(product.image);
      setQuantity(1);
      
      // Auto-select first available options if any
      if (product.sizes && product.sizes.length > 0) setSelectedSize(product.sizes[0]);
      else setSelectedSize("");

      if (product.colors && product.colors.length > 0) setSelectedColor(product.colors[0]);
      else setSelectedColor("");

      if (product.weights && product.weights.length > 0) setSelectedWeight(product.weights[0]);
    }
  }, [product?.id]);

  const handleBack = () => {
    navigate(-1);
  };

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-4">{t("no_results")}</h2>
          <button 
            onClick={() => navigate("/")}
            className="bg-primary text-white px-6 py-2 rounded-xl font-bold"
          >
            {t("back_to_page")}
          </button>
        </div>
      </div>
    );
  }

  // Find top level category
  const findCategoryKey = (name: string) => {
    if (!name) return "";
    for (const [key, categoryData] of Object.entries(categories)) {
      const data = categoryData as any;
      if (data.name === name || (data.subcategories && data.subcategories.some((s: any) => s.name === name))) {
        return key;
      }
    }
    return "";
  };

  const categoryKey = findCategoryKey(product.category);

  const isWishlisted = wishlist.includes(String(product.id));
  
  const basePrice = product.price;
  const currentPrice = basePrice;
    
  const totalPrice = currentPrice * quantity;

  const handleAddToCart = () => {
    if (!product) return;
    
    // Flexible validation
    const catKey = findCategoryKey(product.category);
    if (catKey === "fashion-lifestyle") {
      if (product.sizes && product.sizes.length > 0 && !selectedSize) {
        alert(language === 'bn' ? "দয়া করে একটি সাইজ নির্বাচন করুন" : "Please select a size");
        return;
      }
    }

    setIsAdding(true);
    addToCart({ ...product }, quantity, {
      size: selectedSize,
      color: selectedColor
    });
    
    setTimeout(() => setIsAdding(false), 1000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => {
      navigate("/checkout");
    }, 100);
  };

  const sizes = product.sizes || [];
  const productColors = product.colors || [];
  const colorMap: Record<string, string> = {
    "Black": "#000000",
    "White": "#FFFFFF",
    "Red": "#EF4444",
    "Blue": "#3B82F6",
    "Green": "#10B981",
    "Yellow": "#F59E0B",
    "Pink": "#EC4899",
    "Purple": "#8B5CF6",
    "Gray": "#6B7280",
    "Brown": "#78350F",
  };

  const weights = ["100g", "250g", "500g", "1kg", "2kg", "5kg"];
  const productGallery = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];

  return (
    <div className="min-h-screen flex flex-col font-sans dark:bg-neutral-950 transition-colors">
      <Header />
      
      <main className="flex-grow py-6 md:py-12 pb-24 lg:pb-12">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-primary transition-colors mb-6"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">{t("back_to_page")}</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Product Images */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="aspect-square rounded-[2rem] overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={mainImage}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    src={mainImage || undefined} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                {[product.image, ...productGallery].filter((img, pos, arr) => arr.indexOf(img) === pos).map((img) => (
                  <div 
                    key={img} 
                    onClick={() => setMainImage(img)}
                    className={`aspect-square rounded-2xl overflow-hidden border cursor-pointer transition-all ${
                      mainImage === img ? "border-primary ring-2 ring-primary/20" : "border-neutral-100 dark:border-neutral-800"
                    } bg-white dark:bg-neutral-900`}
                  >
                    <img src={img || undefined} alt="" className={`w-full h-full object-cover transition-opacity ${mainImage === img ? "opacity-100" : "opacity-60 hover:opacity-100"}`} />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                    {product.category} {product.subCategory && `/ ${product.subCategory}`}
                  </span>
                  <div className="flex items-center gap-1 text-yellow-400 ml-auto">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">4.8</span>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">(120 Reviews)</span>
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-black text-neutral-900 dark:text-white mb-4 leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  {product.originalPrice && product.originalPrice > product.price ? (
                    <>
                      <span className="text-xl md:text-2xl text-neutral-400 line-through font-medium">৳{product.originalPrice * quantity}</span>
                      <span className="text-3xl md:text-4xl font-black text-primary">৳{totalPrice}</span>
                      <span className="bg-red-50 text-red-500 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest">
                        {product.discount} {language === 'bn' ? 'ছাড়' : 'OFF'}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl md:text-4xl font-black text-primary">৳{totalPrice}</span>
                  )}
                </div>
              </div>

              {/* Category Specific Options */}
              <div className="space-y-8 mb-8">
                {/* Fashion & Lifestyle: Size & Color */}
                {(categoryKey === "fashion-lifestyle" || product.sizes || product.colors) && (
                  <>
                    {(product.sizes && product.sizes.length > 0) && (
                      <div>
                        <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-4">{t("select_size")}</h4>
                        <div className="flex flex-wrap gap-3">
                          {sizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`px-4 h-10 min-w-[3rem] rounded-xl font-bold text-sm transition-all border ${
                                selectedSize === size 
                                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                                  : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-primary/50"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {productColors && productColors.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-4">{t("select_color")}</h4>
                        <div className="flex flex-wrap gap-3">
                          {productColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={`px-4 h-10 min-w-[4rem] rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-2 ${
                                selectedColor === color 
                                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                                  : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-primary/50"
                              }`}
                            >
                              <div 
                                className="w-3 h-3 rounded-full border border-white/20"
                                style={{ backgroundColor: colorMap[color] || '#888' }}
                              />
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Quantity */}
                <div>
                  <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-4">
                    {t("quantity")} ({t("pieces")})
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-1 border border-neutral-200 dark:border-neutral-700">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        aria-label="পরিমাণ কমান (Decrease quantity)"
                        className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-primary transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="w-12 text-center font-bold text-neutral-800 dark:text-white">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        aria-label="পরিমাণ বাড়ান (Increase quantity)"
                        className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-primary transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button 
                  onClick={handleBuyNow}
                  className="flex-grow bg-primary text-white py-4 rounded-[1.5rem] font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <ShoppingBag size={22} />
                  {t("buy_now")}
                </button>
                <button 
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`flex-grow bg-white dark:bg-neutral-900 border-2 border-primary text-primary py-4 rounded-[1.5rem] font-bold text-lg hover:bg-primary/5 transition-all flex items-center justify-center gap-3 ${isAdding ? "opacity-70 scale-95" : ""}`}
                >
                  <ShoppingCart size={22} />
                  {isAdding ? (language === 'bn' ? "যোগ করা হয়েছে" : "Added!") : t("add_to_cart")}
                </button>
                <button 
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={isWishlisted ? "উইশলিস্ট থেকে মুছুন" : "উইশলিস্টে যুক্ত করুন"}
                  className={`w-16 h-16 rounded-[1.5rem] border flex items-center justify-center transition-all ${
                    isWishlisted 
                      ? "border-red-500 bg-red-50 text-red-500 shadow-lg shadow-red-500/10" 
                      : "border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-red-500 hover:border-red-200"
                  }`}
                >
                  <Heart size={24} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-950/30 text-green-600 rounded-lg">
                    <ShieldCheck size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Authentic Product</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950/30 text-blue-600 rounded-lg">
                    <Truck size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">Fast Delivery</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-950/30 text-orange-600 rounded-lg">
                    <RotateCcw size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">7 Days Return</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-16 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 overflow-hidden">
            <div className="flex border-b border-neutral-100 dark:border-neutral-800">
              {['description', 'specifications', 'reviews']
                .filter(tab => tab !== 'specifications' || product.specifications)
                .map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-6 text-sm font-bold uppercase tracking-widest transition-all relative ${
                    activeTab === tab ? "text-primary" : "text-neutral-400"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="p-8 md:p-12">
              {activeTab === 'description' && (
                product.description ? (
                  <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-400">
                    <h3 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white mb-6 uppercase tracking-tighter">
                      {t("product_description")}
                    </h3>
                    <div className="whitespace-pre-line leading-relaxed text-lg">
                      {product.description}
                    </div>
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-400">
                    <h3 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">{t("product_description")}</h3>
                    <p className="leading-relaxed mb-4">
                      Experience the ultimate in quality and performance with our {product.name}. Carefully designed to meet your everyday needs, this product combines premium materials with cutting-edge technology.
                    </p>
                  </div>
                )
              )}
              {activeTab === 'specifications' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  {product.specifications ? (
                     product.specifications.split(',').map((spec) => {
                       const [label, value] = spec.split(':').map(s => s.trim());
                       return (
                        <div key={spec} className="flex items-center justify-between py-3 border-b border-neutral-50 dark:border-neutral-800">
                          <span className="text-sm text-neutral-500">{label || "Spec"}</span>
                          <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{value || spec}</span>
                        </div>
                       );
                     })
                  ) : (
                    [
                      { label: "Model", value: "VVZ-PRO-2024" },
                      { label: "Material", value: "Premium Composite" },
                      { label: "Warranty", value: "1 Year Official" },
                      { label: "Color", value: selectedColor || "As checked" },
                      { label: "Country of Origin", value: "Bangladesh" }
                    ].map((spec) => (
                      <div key={spec.label} className="flex items-center justify-between py-3 border-b border-neutral-50 dark:border-neutral-800">
                        <span className="text-sm text-neutral-500">{spec.label}</span>
                        <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{spec.value}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-neutral-50 dark:bg-neutral-800/50 rounded-[2.5rem]">
                    <div className="text-center md:border-r border-neutral-200 dark:border-neutral-700 md:pr-8">
                      <h4 className="text-5xl font-black text-neutral-900 dark:text-white mb-2">4.8</h4>
                      <div className="flex text-yellow-400 justify-center mb-2">
                        {[...Array(5)].map((_, i) => <Star key={`main-star-${i}`} size={16} fill="currentColor" />)}
                      </div>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Average Rating</p>
                    </div>
                    
                    <div className="flex-grow space-y-4 w-full">
                      <h5 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                        {language === 'bn' ? 'আপনার রেটিং দিন' : 'Rate this product'}
                      </h5>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setUserRating(star)}
                            className="transition-transform active:scale-90"
                          >
                            <Star 
                              size={32} 
                              className={`transition-colors ${
                                star <= (hoverRating || userRating) ? "text-yellow-400" : "text-neutral-300 dark:text-neutral-600"
                              }`}
                              fill={star <= (hoverRating || userRating) ? "currentColor" : "none"}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-neutral-500 italic">
                        {userRating > 0 && (language === 'bn' ? `আপনি ${userRating} স্টার দিয়েছেন!` : `You rated this ${userRating} stars!`)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          <div className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-black text-neutral-900 dark:text-white">{t("related_products")}</h2>
              <button className="text-primary font-bold text-sm hover:underline">{t("view_all")}</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4).map((p) => (
                <div 
                  key={p.id}
                  onClick={() => { navigate(`/product/${p.id}`); window.scrollTo(0, 0); }}
                  className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-4">
                    <img src={p.image || undefined} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm line-clamp-1 mb-2">{p.name}</h4>
                  <p className="text-primary font-bold">৳{p.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
