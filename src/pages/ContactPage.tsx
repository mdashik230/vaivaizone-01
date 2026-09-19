import React from "react";
import Header from "../components/Header";
import { MessageCircle, PhoneCall, Send, Mail, MapPin, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useSettings } from "../context/SettingsContext";

import { useAdmin } from "../context/AdminContext";

export default function ContactPage() {
  const { language, t } = useSettings();
  const { contactInfo } = useAdmin();

  const waNumber = (contactInfo.whatsappNumber || contactInfo.phone || "").replace(/[^0-9]/g, "");

  const contactOptions = [
    { 
      name: "WhatsApp", 
      value: contactInfo.whatsappNumber || contactInfo.phone, 
      icon: <MessageCircle size={28} className="text-green-500" />, 
      color: "bg-green-50 dark:bg-green-950/30", 
      link: `https://wa.me/${waNumber.startsWith('88') ? waNumber : '88' + waNumber}`,
      description: language === 'bn' ? "সরাসরি মেসেজ করুন" : "Message us directly"
    },
    { 
      name: "IMO", 
      value: contactInfo.phone, 
      icon: <PhoneCall size={28} className="text-blue-500" />, 
      color: "bg-blue-50 dark:bg-blue-950/30", 
      link: `tel:${contactInfo.phone}`,
      description: language === 'bn' ? "কল বা ভিডিও কল" : "Voice or Video call"
    },
    { 
      name: "Telegram", 
      value: contactInfo.telegramLink ? "@" + contactInfo.telegramLink.split('/').pop() : "@channel", 
      icon: <Send size={28} className="text-sky-500" />, 
      color: "bg-sky-50 dark:bg-sky-950/30", 
      link: contactInfo.telegramLink || "#",
      description: language === 'bn' ? "আমাদের সাথে যুক্ত হন" : "Join our community"
    },
    { 
      name: language === 'bn' ? "সরাসরি কল" : "Direct Call", 
      value: contactInfo.phone, 
      icon: <PhoneCall size={28} className="text-primary" />, 
      color: "bg-primary/5 dark:bg-primary/10", 
      link: `tel:${contactInfo.phone}`,
      description: language === 'bn' ? "কাস্টমার সাপোর্ট" : "Customer Support"
    },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow bg-neutral-50 dark:bg-neutral-950 transition-colors">
        <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
          <div className="text-center mb-16">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl md:text-6xl font-display font-black text-neutral-900 dark:text-white mb-4"
            >
              {t("contact")}
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-neutral-500 dark:text-neutral-400 text-lg"
            >
              {language === 'bn' ? 'আমরা আপনার অপেক্ষায় আছি। যেকোনো দরকারে যোগাযোগ করুন।' : 'We are here to help. Reach out to us anytime.'}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactOptions.map((opt, i) => (
              <motion.a
                key={i}
                href={opt.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`p-8 rounded-[2.5rem] ${opt.color} border border-transparent hover:border-primary/20 shadow-sm hover:shadow-xl transition-all group flex flex-col items-center text-center`}
              >
                <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl shadow-md mb-6 transform group-hover:rotate-12 transition-transform">
                  {opt.icon}
                </div>
                <h3 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">{opt.name}</h3>
                <p className="text-primary font-mono font-bold mb-4">{opt.value}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{opt.description}</p>
                <div className="flex items-center gap-2 text-primary font-bold">
                   <span>{language === 'bn' ? 'যোগাযোগ করুন' : 'Connect Now'}</span>
                   <ChevronRight size={18} />
                </div>
              </motion.a>
            ))}
          </div>

          {/* More Info */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-sm mb-4">
                <MapPin size={24} className="text-primary" />
              </div>
              <h4 className="font-bold text-neutral-800 dark:text-neutral-200">{language === 'bn' ? 'অফিস ঠিকানা' : 'Office Location'}</h4>
              <p className="text-sm text-neutral-500 mt-2">{contactInfo.address || "Sector 10, Uttara, Dhaka"}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-sm mb-4">
                <Mail size={24} className="text-primary" />
              </div>
              <h4 className="font-bold text-neutral-800 dark:text-neutral-200">{language === 'bn' ? 'ইমেইল' : 'Email Us'}</h4>
              <p className="text-sm text-neutral-500 mt-2">{contactInfo.email || "support@vaivaizone.com"}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-sm mb-4">
                <PhoneCall size={24} className="text-primary" />
              </div>
              <h4 className="font-bold text-neutral-800 dark:text-neutral-200">{language === 'bn' ? 'সাপোর্ট' : 'Support Line'}</h4>
              <p className="text-sm text-neutral-500 mt-2">{contactInfo.phone}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
