import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, MessageCircle, Send, Music, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";

export default function Footer() {
  const { contactInfo } = useAdmin();
  
  return (
    <footer className="bg-neutral-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div>
            <h2 className="text-3xl font-display font-bold text-primary tracking-tighter mb-6">
              Vai Vai<span className="text-white"> Zone</span>
            </h2>
            <p className="text-neutral-400 mb-8 leading-relaxed">
              Your one-stop destination for the best tech and fashion in Bangladesh. Quality products, fast delivery, and unbeatable prices.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href={contactInfo.supportLink} target="_blank" rel="noopener noreferrer" className="bg-white/10 p-2.5 rounded-full hover:bg-blue-600 transition-colors">
                <Facebook size={20} />
              </a>
              <a href={`https://wa.me/${(contactInfo.whatsappNumber || "").replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="bg-white/10 p-2.5 rounded-full hover:bg-green-600 transition-colors">
                <MessageCircle size={20} />
              </a>
              <a href={contactInfo.telegramLink || "#"} target="_blank" rel="noopener noreferrer" className="bg-white/10 p-2.5 rounded-full hover:bg-sky-500 transition-colors">
                <Send size={20} />
              </a>
              {contactInfo.youtubeLink && (
                <a href={contactInfo.youtubeLink} target="_blank" rel="noopener noreferrer" className="bg-white/10 p-2.5 rounded-full hover:bg-red-600 transition-colors">
                  <Youtube size={20} />
                </a>
              )}
              {contactInfo.tiktokLink && (
                <a href={contactInfo.tiktokLink} target="_blank" rel="noopener noreferrer" className="bg-white/10 p-2.5 rounded-full hover:bg-black transition-colors flex items-center justify-center">
                  <Music size={20} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-neutral-400">
              <li><Link to="/contact" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/profile" className="hover:text-primary transition-colors">My Profile</Link></li>
              <li><Link to="/admin" className="hover:text-primary transition-colors flex items-center gap-1.5 text-neutral-500 hover:text-primary"><ShieldCheck size={14} /> Admin Portal</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-bold mb-6">Popular Categories</h4>
            <ul className="space-y-4 text-neutral-400">
              <li><a href="#" className="hover:text-primary transition-colors">Mobiles & Tablets</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Computer Accessories</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Men's Fashion</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Women's Fashion</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-6">Contact Info</h4>
            <ul className="space-y-4 text-neutral-400">
              <li className="flex items-start gap-3">
                <MapPin className="text-primary mt-1" size={18} />
                <span>{contactInfo.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-primary" size={18} />
                <span>{contactInfo.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-primary" size={18} />
                <span>{contactInfo.email}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-top border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-500 text-sm">
          <p>© 2026 Vai Vai Zone. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary">Sitemap</a>
            <a href="#" className="hover:text-primary">FAQ</a>
            <a href="#" className="hover:text-primary">Track Order</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
