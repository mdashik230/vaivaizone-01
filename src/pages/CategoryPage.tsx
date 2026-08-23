import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, Smartphone, Shirt, ShoppingBasket, ShoppingBag } from "lucide-react";
import React from "react";
import Header from "../components/Header";
import { useAdmin } from "../context/AdminContext";

const iconMap: Record<string, React.ReactNode> = {
  "gadgets-accessories": <Smartphone size={48} className="text-blue-500" />,
  "fashion-lifestyle": <Shirt size={48} className="text-pink-500" />,
  "groceries-fresh-food": <ShoppingBasket size={48} className="text-green-500" />
};

const DefaultIcon = () => (
  <ShoppingBag size={48} className="text-primary" />
);

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { products, categories } = useAdmin();
  const category = categoryId ? categories[categoryId] : null;

  if (!category || !categoryId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Category not found</h1>
        <button onClick={() => navigate("/")} className="text-primary font-bold">Back to Home</button>
      </div>
    );
  }

  const getProductCount = (subName: string) => {
    return products.filter(p => (p as any).subCategory?.toLowerCase() === subName.toLowerCase() || p.category?.toLowerCase() === subName.toLowerCase()).length;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow pb-28 md:pb-16">
        {/* Banner */}
        <div className="relative h-[250px] md:h-[350px] lg:h-[450px] overflow-hidden">
          <img 
            src={category.image || "https://images.unsplash.com/photo-1546054452-963030310217?auto=format&fit=crop&q=80&w=1200"} 
            alt={category.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white px-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/10 backdrop-blur-md p-4 rounded-3xl mb-4"
            >
              {iconMap[categoryId] || <DefaultIcon />}
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl md:text-6xl font-display font-black text-center"
            >
              {category.name}
            </motion.h1>
          </div>
          
          <button 
            onClick={() => navigate(-1)} 
            className="absolute top-6 left-6 z-20 bg-white/20 hover:bg-primary backdrop-blur-md text-white p-2.5 rounded-full transition-all shadow-lg active:scale-95"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Subcategories Grid */}
        <section className="py-12 md:py-20 bg-neutral-50 dark:bg-neutral-900/50 transition-colors">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-display font-extrabold text-neutral-900 dark:text-white mb-2">Explore Subcategories</h2>
              <p className="text-neutral-500 dark:text-neutral-400">আমাদের {category.name} সংগ্রহের আরও গভীরে যান</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {category.subcategories && category.subcategories.length > 0 ? category.subcategories.map((sub: any, i: number) => {
                const count = getProductCount(sub.name);
                return (
                  <Link 
                    key={sub.name} 
                    to={`/category/${categoryId}/${sub.name.toLowerCase().replace(/ /g, '-')}`}
                    className="block"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      viewport={{ once: true }}
                      className="group bg-white dark:bg-neutral-900 rounded-[2rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer border border-neutral-100 dark:border-neutral-800 overflow-hidden"
                    >
                      <div className="aspect-[4/5] overflow-hidden relative border-b border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
                        {sub.image ? (
                          <img 
                            src={sub.image || undefined} 
                            alt={sub.name} 
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                            <ShoppingBag size={48} className="text-neutral-300 dark:text-neutral-700" />
                            <span className="text-[10px] font-black text-neutral-300 dark:text-neutral-700 uppercase tracking-widest">No Image</span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-primary shadow-sm">
                          {count}
                        </div>
                      </div>
                      <div className="p-5 text-center">
                        <h3 className="font-black text-neutral-800 dark:text-neutral-100 text-sm md:text-base leading-tight group-hover:text-primary transition-colors uppercase tracking-tighter">{sub.name}</h3>
                        <p className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-widest">Collection</p>
                      </div>
                    </motion.div>
                  </Link>
                );
              }) : (
                <div className="col-span-full py-12 text-center">
                  <p className="text-neutral-500">এই ক্যাটাগরিতে এখনও কোনো সাব-ক্যাটাগরি যোগ করা হয়নি।</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
