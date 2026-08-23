import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

export default function HeroSlider() {
  const { sliders } = useAdmin();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (sliders.length === 0) return;
    
    // Ensure current index is valid if sliders length decreased
    if (current >= sliders.length) {
      setCurrent(0);
    }

    const timer = setInterval(() => {
      setCurrent((prev) => (prev >= sliders.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [sliders.length, current]);

  const nextSlide = () => setCurrent((prev) => (prev === sliders.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrent((prev) => (prev === 0 ? sliders.length - 1 : prev - 1));

  if (sliders.length === 0) return null;

  return (
    <section className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[600px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent z-10" />
          <img 
            src={sliders[current]?.image || undefined} 
            alt={sliders[current]?.title}
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-center items-start px-8 md:px-16 lg:px-32">
             <motion.span
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-primary text-xs md:text-lg font-black tracking-[0.2em] uppercase mb-4"
            >
              Exclusive Collection
            </motion.span>
            <motion.h2
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-white text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-black leading-[0.9] mb-8 uppercase tracking-tighter max-w-4xl"
            >
              {sliders[current].title || 'Premium Deals'}
            </motion.h2>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              whileHover={{ scale: 1.05, x: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (sliders[current].link) {
                  window.open(sliders[current].link, '_blank');
                }
              }}
              className="bg-primary text-white px-10 py-4 rounded-full font-black text-sm md:text-lg transition-all shadow-2xl shadow-primary/30 flex items-center gap-3 group"
            >
              Shop Now
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all hidden md:block"
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all hidden md:block"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {sliders.map((slider, i) => (
          <button
            key={slider.id}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === current ? "bg-primary w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
