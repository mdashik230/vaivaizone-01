import { MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { useLocation } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { useKeyboardStatus } from "../hooks/useKeyboardStatus";

export default function FloatingWhatsApp() {
  const { pathname } = useLocation();
  const { contactInfo } = useAdmin();
  const isKeyboardOpen = useKeyboardStatus();
  const rawNumber = contactInfo.whatsappNumber || contactInfo.phone;
  const waNumber = rawNumber.replace(/[^0-9]/g, '');
  
  // Only display the floating WhatsApp support button on the Home page ('/') and hide when keyboard is open
  if (pathname !== '/' || !waNumber || isKeyboardOpen) return null;

  return (
    <motion.a
      href={`https://wa.me/${waNumber.startsWith('88') ? waNumber : '88' + waNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-20 right-6 lg:bottom-6 lg:right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center justify-center"
    >
      <MessageCircle size={28} />
      <span className="absolute -top-1 -left-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
      </span>
    </motion.a>
  );
}
