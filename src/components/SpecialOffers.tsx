import { motion } from "motion/react";
import { useAdmin } from "../context/AdminContext";
import { useSettings } from "../context/SettingsContext";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export default function SpecialOffers() {
  const { offers } = useAdmin();
  const { language } = useSettings();
  const navigate = useNavigate();
  const activeOffers = offers.filter(o => o.status === 'active');

  if (activeOffers.length === 0) {
    return null; // Don't show the section if no offers
  }

  const handleExplore = (targetLink?: string) => {
    const link = (targetLink && targetLink.trim()) || '/shop';
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      navigate(link);
    }
  };

  return (
    <section className="py-12 bg-white dark:bg-neutral-950 transition-colors">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeOffers.map(offer => (
            <motion.div 
              key={offer.id}
              whileHover={{ y: -4 }}
              onClick={() => handleExplore(offer.link)}
              className="relative min-h-[260px] md:min-h-[290px] rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
            >
              <img 
                src={offer.image || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80"} 
                alt={offer.title} 
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105"
              />
              {/* Vibrant, balanced overlay so content pops brightly without dimming the button */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent flex flex-col justify-center p-8 md:p-12 z-10">
                {offer.badge && (
                  <div className="flex items-center gap-1.5 bg-primary text-white text-[11px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest w-fit mb-3 shadow-md shadow-primary/30">
                    <Sparkles size={12} />
                    <span>{offer.badge}</span>
                  </div>
                )}
                <h3 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-black mb-2 leading-tight drop-shadow-md">
                  {offer.title}
                </h3>
                <p className="text-white/90 mb-6 max-w-sm line-clamp-2 text-sm md:text-base font-medium drop-shadow">
                  {offer.description}
                </p>
                
                {/* Bright, luminous Explore button that never stays dark */}
                <motion.button 
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExplore(offer.link);
                  }}
                  className="bg-white text-neutral-950 hover:bg-primary hover:text-white px-8 py-3.5 rounded-full font-black text-sm md:text-base w-fit transition-all duration-300 flex items-center gap-3 cursor-pointer shadow-2xl hover:shadow-primary/40 border border-white/80"
                >
                  <span>{language === 'bn' ? 'এক্সপ্লোর করুন' : 'Explore Now'}</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
