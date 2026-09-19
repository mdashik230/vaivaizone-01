import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { 
  ShieldCheck, 
  Truck, 
  Clock, 
  HeartHandshake, 
  Award, 
  PhoneCall, 
  MapPin, 
  Mail, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import Header from "../components/Header";
import { useSettings } from "../context/SettingsContext";
import { useAdmin } from "../context/AdminContext";

export default function AboutPage() {
  const { language } = useSettings();
  const { contactInfo } = useAdmin();

  const isBn = language === "bn";
  const shopName = contactInfo?.name || "Vai Vai Zone";

  const coreValues = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary" />,
      title: isBn ? "সততা ও বিশ্বাস" : "Honesty & Trust",
      desc: isBn 
        ? "আমাদের মূল নীতি হলো সততা ও বিশ্বাস। আমরা প্রতিটি গ্রাহকের সাথে স্বচ্ছ ও আস্থার সম্পর্ক বজায় রাখি।"
        : "Honesty and trust are our core foundation. We maintain complete transparency with every customer."
    },
    {
      icon: <Award className="w-8 h-8 text-amber-500" />,
      title: isBn ? "১০০% প্রিমিয়াম কোয়ালিটি" : "100% Premium Quality",
      desc: isBn
        ? "আমরা শুধুমাত্র বাছাইকৃত ও সেরা মানের পণ্য সরবরাহ করি, যা গ্রাহকদের সন্তুষ্টি নিশ্চিত করে।"
        : "We exclusively curate top-tier, reliable products that guarantee user satisfaction."
    },
    {
      icon: <Truck className="w-8 h-8 text-emerald-500" />,
      title: isBn ? "দ্রুত ও নিরাপদ ডেলিভারি" : "Fast & Secure Delivery",
      desc: isBn
        ? "স্টেডফাস্ট কুরিয়ারের মাধ্যমে সমগ্র বাংলাদেশে ক্যাশ অন ডেলিভারিতে দ্রুত পৌঁছে দিই আপনার পার্সেল।"
        : "Fast doorstep delivery across Bangladesh with Cash on Delivery through Steadfast Courier."
    },
    {
      icon: <Clock className="w-8 h-8 text-blue-500" />,
      title: isBn ? "সার্বক্ষণিক কাস্টমার সাপোর্ট" : "Dedicated Support",
      desc: isBn
        ? "পণ্য বা অর্ডার সংক্রান্ত যেকোনো প্রয়োজনে আমাদের সাপোর্ট টিম সব সময় আপনার সহায়তায় নিয়োজিত।"
        : "Our support team is always ready to assist you with any questions or order inquiries."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-12 md:py-20 overflow-hidden border-b border-neutral-200/60 dark:border-neutral-800">
          <div className="container mx-auto px-4 max-w-5xl text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6"
            >
              <Sparkles size={14} />
              <span>{isBn ? "আমাদের পরিচিতি" : "About Us"}</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-5xl md:text-6xl font-display font-black tracking-tight mb-6"
            >
              {isBn ? (
                <>
                  স্বাগতম <span className="text-primary">{shopName}</span>-এ
                </>
              ) : (
                <>
                  Welcome to <span className="text-primary">{shopName}</span>
                </>
              )}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed"
            >
              {isBn 
                ? "“সততা ও বিশ্বাস এ আমরা অবিচল” — আপনার আস্থা ও সন্তুষ্টিই আমাদের প্রতিটি পদক্ষেপের মূল প্রেরণা।"
                : "“Unwavering in Honesty and Trust” — Your satisfaction and confidence inspire everything we do."}
            </motion.p>
          </div>
        </section>

        {/* Mission & Story Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-xs">
              <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-primary">
                  {isBn ? "আমাদের লক্ষ্য ও উদ্দেশ্য" : "Our Mission"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white leading-snug">
                  {isBn 
                    ? "সেরা মানের পণ্য সহজে ও নিরাপদে আপনার ঘরে পৌঁছে দেওয়া" 
                    : "Delivering exceptional quality to your doorstep effortlessly"}
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">
                  {isBn 
                    ? `${shopName}-এর যাত্রা শুরু হয়েছিল গ্রাহকদের সঠিক দামে নিখুঁত ও মানসম্মত পণ্য উপহার দেওয়ার প্রত্যয় নিয়ে। আমরা সবসময় চেষ্টা করি সেরা ব্র্যান্ড ও ট্রাস্টেড পণ্যগুলো আপনাদের কাছে পৌঁছে দিতে।`
                    : `${shopName} was founded with the commitment to provide top-grade products at fair prices with transparent service and zero compromise on quality.`}
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed">
                  {isBn 
                    ? "সহজ অনলাইন অর্ডারিং, বিশ্বস্ত ক্যাশ অন ডেলিভারি এবং দ্রুত কাস্টমার সাপোর্টের মাধ্যমে আমরা আপনার শপিং অভিজ্ঞতাকে করে তুলি আনন্দদায়ক।"
                    : "With streamlined online checkout, reliable Cash on Delivery, and attentive customer care, we strive to make online shopping seamless."}
                </p>

                <div className="pt-2">
                  <Link 
                    to="/products"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary/90 transition-all"
                  >
                    <span>{isBn ? "প্রোডাক্ট দেখুন" : "Explore Products"}</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 dark:bg-neutral-800/60 p-5 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 text-center">
                  <p className="text-3xl font-black text-primary mb-1">১০০%</p>
                  <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                    {isBn ? "আসল পণ্য" : "Authentic Products"}
                  </p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/60 p-5 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 text-center">
                  <p className="text-3xl font-black text-emerald-500 mb-1">৬৪</p>
                  <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                    {isBn ? "জেলায় ডেলিভারি" : "Districts Covered"}
                  </p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/60 p-5 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 text-center">
                  <p className="text-3xl font-black text-amber-500 mb-1">COD</p>
                  <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                    {isBn ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery"}
                  </p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/60 p-5 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 text-center">
                  <p className="text-3xl font-black text-blue-500 mb-1">২৪/৭</p>
                  <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                    {isBn ? "সাপোর্ট সহায়তা" : "Customer Care"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-12 md:py-16 bg-neutral-100/60 dark:bg-neutral-900/40">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-xs font-black uppercase tracking-wider text-primary">
                {isBn ? "কেন আমরা আলাদা" : "Why Choose Us"}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-neutral-900 dark:text-white mt-1">
                {isBn ? "আমাদের মূল বৈশিষ্ট্যসমূহ" : "Our Core Values"}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {coreValues.map((val, idx) => (
                <div 
                  key={idx}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-6 space-y-3 transition-all hover:shadow-md"
                >
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl w-fit">
                    {val.icon}
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    {val.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Info & CTA Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-3xl p-6 sm:p-10 text-center space-y-6">
              <div className="w-14 h-14 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto">
                <HeartHandshake size={28} />
              </div>
              <div className="max-w-xl mx-auto space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                  {isBn ? "আপনার কি কোনো প্রশ্ন আছে?" : "Have any questions?"}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {isBn 
                    ? "পণ্য সম্পর্কে জানতে বা সরাসরি অর্ডার করতে আমাদের সাথে যে কোনো সময় যোগাযোগ করতে পারেন।"
                    : "Feel free to reach out to our support team anytime for order guidance or product inquiries."}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {contactInfo.address && (
                  <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 px-3.5 py-2 rounded-xl shadow-xs">
                    <MapPin size={16} className="text-primary" />
                    <span>{contactInfo.address}</span>
                  </div>
                )}
                {contactInfo.phone && (
                  <a 
                    href={`tel:${contactInfo.phone}`}
                    className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 px-3.5 py-2 rounded-xl shadow-xs hover:text-primary transition-colors"
                  >
                    <PhoneCall size={16} className="text-emerald-500" />
                    <span>{contactInfo.phone}</span>
                  </a>
                )}
                {contactInfo.email && (
                  <a 
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 px-3.5 py-2 rounded-xl shadow-xs hover:text-primary transition-colors"
                  >
                    <Mail size={16} className="text-blue-500" />
                    <span>{contactInfo.email}</span>
                  </a>
                )}
              </div>

              <div className="pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary/90 transition-all"
                >
                  <PhoneCall size={16} />
                  <span>{isBn ? "যোগাযোগ পেইজে যান" : "Contact Us Page"}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
