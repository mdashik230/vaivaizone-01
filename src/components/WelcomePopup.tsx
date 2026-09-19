import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Sparkles, ArrowRight, ShoppingBag, Gift } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export default function WelcomePopup() {
  const { welcomePopupSettings } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Listen for custom preview trigger from admin panel
    const handlePreview = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-welcome-popup-preview', handlePreview);
    return () => {
      window.removeEventListener('open-welcome-popup-preview', handlePreview);
    };
  }, []);

  useEffect(() => {
    if (!welcomePopupSettings) return;

    // Do not show if disabled
    if (!welcomePopupSettings.isEnabled) {
      setIsOpen(false);
      return;
    }

    // Do not show on admin or login or payment verification pages
    const path = location.pathname.toLowerCase();
    if (
      path.startsWith('/admin') || 
      path.startsWith('/login') || 
      path.startsWith('/payment-verify')
    ) {
      return;
    }

    // If showOncePerSession is true, check session storage
    if (welcomePopupSettings.showOncePerSession) {
      const alreadySeen = sessionStorage.getItem('has_seen_welcome_popup');
      if (alreadySeen) {
        return;
      }
    }

    // Give a small natural delay (800ms) after page load so user experiences smooth initial render
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [welcomePopupSettings?.isEnabled, welcomePopupSettings?.showOncePerSession, location.pathname]);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('has_seen_welcome_popup', 'true');
    } catch {}
  };

  const handleAction = () => {
    handleClose();
    const link = welcomePopupSettings?.buttonLink || '/products';
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank');
    } else {
      navigate(link);
    }
  };

  if (!isOpen || !welcomePopupSettings || !welcomePopupSettings.isEnabled) {
    return null;
  }

  return (
    <AnimatePresence>
      <div 
        id="welcome-popup-modal"
        className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-neutral-100 dark:border-neutral-800 relative my-auto"
        >
          {/* Close button */}
          <button
            id="close-welcome-popup-btn"
            type="button"
            onClick={handleClose}
            className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md active:scale-95"
            title="বন্ধ করুন"
          >
            <X size={18} />
          </button>

          {/* Optional Banner Image */}
          {welcomePopupSettings.imageUrl && (
            <div className="relative w-full h-44 sm:h-52 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <img
                src={welcomePopupSettings.imageUrl}
                alt="Welcome banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Badge Tag on image */}
              {welcomePopupSettings.badgeText && (
                <div className="absolute bottom-3 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-xs font-black shadow-lg">
                  <Sparkles size={12} className="animate-pulse" />
                  <span>{welcomePopupSettings.badgeText}</span>
                </div>
              )}
            </div>
          )}

          {/* Modal Content */}
          <div className="p-6 sm:p-7 text-center space-y-4">
            {/* If no image, show badge here */}
            {!welcomePopupSettings.imageUrl && welcomePopupSettings.badgeText && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">
                <Gift size={13} />
                <span>{welcomePopupSettings.badgeText}</span>
              </div>
            )}

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white leading-snug">
              {welcomePopupSettings.title || 'আমাদের শপে আপনাকে স্বাগতম!'}
            </h2>

            {/* Message */}
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-md mx-auto">
              {welcomePopupSettings.message || 'সেরা গ্যাজেট ও ফ্যাশন আইটেম সেরা মূল্যে পেতে আজই অর্ডার করুন।'}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <button
                id="welcome-popup-action-btn"
                type="button"
                onClick={handleAction}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 group active:scale-95"
              >
                <ShoppingBag size={17} />
                <span>{welcomePopupSettings.buttonText || 'কেনাকাটা শুরু করুন'}</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="welcome-popup-dismiss-btn"
                type="button"
                onClick={handleClose}
                className="py-3 px-5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold text-xs transition-colors"
              >
                পরে দেখবো
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
