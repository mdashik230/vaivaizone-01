import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdmin } from "../context/AdminContext";

export default function HeroSlider() {
  const { sliders } = useAdmin();
  const [current, setCurrent] = useState(0);
  const isFirstSlide = useRef(true);

  useEffect(() => {
    if (sliders.length === 0) return;
    
    // Ensure current index is valid if sliders length decreased
    if (current >= sliders.length) {
      setCurrent(0);
    }

    const timer = setInterval(() => {
      isFirstSlide.current = false;
      setCurrent((prev) => (prev >= sliders.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [sliders.length, current]);

  const nextSlide = () => {
    isFirstSlide.current = false;
    setCurrent((prev) => (prev === sliders.length - 1 ? 0 : prev + 1));
  };
  
  const prevSlide = () => {
    isFirstSlide.current = false;
    setCurrent((prev) => (prev === 0 ? sliders.length - 1 : prev - 1));
  };

  const handleDotClick = (i: number) => {
    isFirstSlide.current = false;
    setCurrent(i);
  };

  if (sliders.length === 0) {
    return (
      <section className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[600px] bg-neutral-900 animate-pulse" />
    );
  }

  const activeSlider = sliders[current] || sliders[0];
  const shouldAnimate = !isFirstSlide.current;

  return (
    <section className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[600px] overflow-hidden bg-neutral-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent z-10" />
          <img 
            src={activeSlider?.image || undefined} 
            alt={activeSlider?.title || 'Hero Banner'}
            fetchPriority={current === 0 ? "high" : "auto"}
            loading={current === 0 ? "eager" : "lazy"}
            decoding="async"
            width="1200"
            height="600"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-center items-start px-8 md:px-16 lg:px-32">
            <span className="text-primary text-xs md:text-lg font-black tracking-[0.2em] uppercase mb-4 drop-shadow">
              Exclusive Collection
            </span>
            <h2 className="text-white text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-black leading-[0.9] mb-8 uppercase tracking-tighter max-w-4xl drop-shadow-md">
              {activeSlider.title || 'Premium Deals'}
            </h2>
            <motion.button
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (activeSlider.link) {
                  window.open(activeSlider.link, '_blank');
                }
              }}
              className="bg-primary text-white px-8 md:px-10 py-3 md:py-4 rounded-full font-black text-sm md:text-lg transition-all shadow-2xl shadow-primary/30 flex items-center gap-3 group"
            >
              <span>Shop Now</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      <button 
        onClick={prevSlide}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all hidden md:block"
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all hidden md:block"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {sliders.map((slider, i) => (
          <button
            key={slider.id}
            onClick={() => handleDotClick(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2.5 rounded-full transition-all ${
              i === current ? "bg-primary w-8" : "bg-white/50 w-2.5"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
