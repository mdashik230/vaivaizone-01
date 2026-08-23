import { motion } from "motion/react";
import { useAdmin } from "../context/AdminContext";

export default function SpecialOffers() {
  const { offers } = useAdmin();
  const activeOffers = offers.filter(o => o.status === 'active');

  if (activeOffers.length === 0) {
    return null; // Don't show the section if no offers
  }

  return (
    <section className="py-12 bg-white dark:bg-neutral-950 transition-colors">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeOffers.map(offer => (
            <motion.div 
              key={offer.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => offer.link && window.open(offer.link, '_blank')}
              className="relative h-[250px] rounded-[2rem] overflow-hidden group cursor-pointer"
            >
              <img 
                src={offer.image} 
                alt={offer.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/80 to-transparent flex flex-col justify-center p-8 md:p-12">
                {offer.badge && <span className="text-white/80 font-medium mb-2 uppercase tracking-widest">{offer.badge}</span>}
                <h3 className="text-white text-3xl md:text-5xl font-display font-black mb-2">{offer.title}</h3>
                <p className="text-white/90 mb-6 max-w-xs line-clamp-2">{offer.description}</p>
                <button className="bg-primary text-white px-8 py-3 rounded-full font-bold w-fit hover:shadow-xl transition-all">
                  Explore Now
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
