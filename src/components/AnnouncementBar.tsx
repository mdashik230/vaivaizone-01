import { motion } from "motion/react";
import { useAdmin } from "../context/AdminContext";

export default function AnnouncementBar() {
  const { scrollingMessage } = useAdmin();
  
  return (
    <div className="bg-primary text-white py-2 overflow-hidden whitespace-nowrap border-b border-white/10 relative z-40">
      <div className="flex animate-scroll hover:[animation-play-state:paused]">
        <div className="flex-shrink-0 flex items-center gap-4 px-4 min-w-full justify-around">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="font-display font-bold text-sm md:text-base tracking-tight">
              {scrollingMessage} • 
            </span>
          ))}
        </div>
        <div className="flex-shrink-0 flex items-center gap-4 px-4 min-w-full justify-around">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="font-display font-bold text-sm md:text-base tracking-tight">
              {scrollingMessage} • 
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
