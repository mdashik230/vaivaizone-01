import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { useSettings } from "../context/SettingsContext";

export default function Categories() {
  const { categories } = useAdmin();
  const { language } = useSettings();
  
  // Convert categories object to array and filter by active status
  const categoryList = Object.entries(categories)
    .map(([slug, data]: [string, any]) => ({
      slug,
      ...data
    }))
    .filter(cat => cat.status === 'active' || !cat.status);

  return (
    <section className="py-12 md:py-20 bg-white dark:bg-neutral-950 transition-colors">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center md:text-left">
          <h2 className="text-3xl font-display font-extrabold text-neutral-900 dark:text-white mb-2">Categories</h2>
          <p className="text-neutral-500 dark:text-neutral-400">আমাদের বিশেষ সংগ্রহ থেকে সেরা পণ্যগুলো বেছে নিন</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {categoryList.map((cat) => (
            <Link key={cat.slug} to={`/category/${cat.slug}`} className="block">
              <motion.div
                whileHover={{ y: -8 }}
                className="group relative overflow-hidden rounded-2xl md:rounded-3xl cursor-pointer"
              >
                <div className="aspect-[4/5] md:aspect-[3/4]">
                  <img 
                    src={cat.image || "https://images.unsplash.com/photo-1546054452-963030310217?auto=format&fit=crop&q=80&w=1200"} 
                    alt={cat.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-8">
                    <h3 className="text-white text-base md:text-2xl font-bold leading-tight group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    
                    {/* Subcategories - Hidden on mobile for space */}
                    {cat.subcategories && (
                      <div className="hidden sm:flex flex-wrap gap-1 md:gap-2 mt-2 md:mt-3 max-h-0 opacity-0 group-hover:max-h-32 group-hover:opacity-100 transition-all duration-500 overflow-hidden">
                        {cat.subcategories.slice(0, 3).map((sub: any) => (
                          <span 
                            key={sub.name || sub} 
                            className="bg-white/20 hover:bg-primary backdrop-blur-md text-white text-[8px] md:text-xs px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border border-white/10 transition-colors"
                          >
                            {sub.name || sub}
                          </span>
                        ))}
                      </div>
                    )}

                    <span className="text-white/70 text-[10px] md:text-sm mt-2 md:mt-4 flex items-center group-hover:translate-x-2 transition-transform duration-300">
                      {language === 'bn' ? 'সংগ্রহ দেখুন' : 'Browse'} →
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
