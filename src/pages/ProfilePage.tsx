import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import { User, Package, MapPin, Heart, Settings, LogOut, ChevronRight, Tag, ArrowLeft, Plus, Trash2, Edit2, Globe, Moon, Bell, CreditCard, LogIn, ChevronDown, ChevronUp, ShoppingBag, Check, Ban, Phone, Calendar, Truck, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { useOrders } from "../context/OrderContext";
import { useCart } from "../context/CartContext";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { formatSteadfastStatus } from "../utils/steadfast";

type Tab = "main" | "orders" | "addresses" | "wishlist" | "settings" | "editProfile" | "admin";

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language, theme, notifications, setLanguage, setTheme, setNotifications, t } = useSettings();
  const { orders } = useOrders();
  const { cart, wishlist: wishlistIds, wishlistCount, toggleWishlist } = useCart();
  const { products: allProducts } = useAdmin();
  const { user, userProfile, isAdmin, logout, loginWithGoogle } = useAuth();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Get actual product data for wishlist items
  const wishlistItems = allProducts.filter(product => wishlistIds.includes(product.id.toString()));
  
  const [addresses, setAddresses] = useState<{id: number, type: string, address: string, phone: string}[]>(() => {
    const saved = localStorage.getItem("user_addresses");
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem("user_addresses", JSON.stringify(addresses));
  }, [addresses]);

  const deleteAddress = (id: number) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };
  
  
  // Use search params to handle tabs so back button works correctly
  const activeTab = (searchParams.get("tab") as Tab) || "main";

  useEffect(() => {
    if (activeTab === "admin" && isAdmin) {
      navigate("/admin");
    } else if (activeTab === "admin") {
      setActiveTab("main");
    }
  }, [activeTab, navigate, isAdmin]);

  const setActiveTab = (tab: Tab) => {
    if (tab === "main") {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  // Scroll to top smoothly when tab changes within profile
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const stats = [
    { label: language === "bn" ? "অর্ডার" : "Orders", value: orders.length.toString(), icon: <Package size={18} />, tab: "orders" as const },
    { label: language === "bn" ? "উইশলিস্ট" : "Wishlist", value: wishlistCount.toString(), icon: <Heart size={18} />, tab: "wishlist" as const },
    { label: language === "bn" ? "সেটিংস" : "Settings", value: "২", icon: <Tag size={18} />, tab: "settings" as const },
  ];

  const menuOptions = [
    { id: "orders" as const, name: t("orders"), icon: <Package className="text-blue-500" /> },
    { id: "addresses" as const, name: t("address"), icon: <MapPin className="text-green-500" /> },
    { id: "wishlist" as const, name: t("wishlist"), icon: <Heart className="text-pink-500" /> },
    { id: "settings" as const, name: t("settings"), icon: <Settings className="text-neutral-500" /> },
    ...(isAdmin ? [{ id: "admin" as const, name: "Admin Panel", icon: <ArrowLeft className="text-primary rotate-180" /> }] : []),
  ];

  const [settings, setSettings] = useState({
    notifications: true,
    language: "বাংলা",
    darkMode: false,
    verified: true
  });

  const renderContent = () => {
    switch (activeTab) {
      case "orders":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white underline decoration-primary decoration-4 underline-offset-8">{t("orders")}</h2>
              <span className="bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full text-xs font-bold text-neutral-500 dark:text-neutral-400">{orders.length} {language === 'bn' ? 'টি অর্ডার' : 'Orders'}</span>
            </div>
            {orders.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 p-12 rounded-[2.5rem] border border-dashed border-neutral-200 dark:border-neutral-800 text-center">
                <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-300">
                  <Package size={32} />
                </div>
                <p className="text-neutral-500 dark:text-neutral-400 font-bold">
                  {language === 'bn' ? 'আপনার কোনো অর্ডার নেই' : 'You have no orders yet'}
                </p>
                <button 
                  onClick={() => navigate("/")}
                  className="mt-6 text-primary font-black text-sm hover:underline"
                >
                  {language === 'bn' ? 'শপিং শুরু করুন' : 'Start Shopping'}
                </button>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden transition-all duration-300">
                  <div 
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    className="p-6 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-neutral-900 dark:text-neutral-100">Order #{order.id.slice(-6).toUpperCase()}</p>
                          {expandedOrderId === order.id ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
                        </div>
                        <p className="text-xs text-neutral-400">{new Date(order.date).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right">
                        <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${
                          order.status === 'delivered' ? "bg-green-100 text-green-600 dark:bg-green-500/10" :
                          order.status === 'shipped' ? "bg-blue-100 text-blue-600 dark:bg-blue-500/10" :
                          order.status === 'pending' ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10" : 
                          "bg-red-100 text-red-600 dark:bg-red-500/10"
                        }`}>
                          {order.status}
                        </span>
                        <p className="text-lg font-black text-primary">৳{order.total}</p>
                      </div>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedOrderId === order.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-2 border-t border-neutral-50 dark:border-neutral-800">
                          {/* Payment & Tracking Info */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl">
                              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <CreditCard size={12} /> {language === 'bn' ? 'পেমেন্ট ইনফো' : 'Payment Info'}
                              </p>
                              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">{order.paymentMethod}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className={`text-[10px] font-black uppercase ${order.paymentStatus === 'Paid' ? 'text-green-500' : 'text-amber-500'}`}>
                                  {order.paymentStatus || (language === 'bn' ? 'পেন্ডিং' : 'Pending')}
                                </p>
                                {order.transactionId && (
                                  <p className="text-[10px] text-neutral-400 font-mono">TXN: {order.transactionId}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl">
                              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <MapPin size={12} /> {language === 'bn' ? 'ডেলিভারি অ্যাড্রেস' : 'Delivery Address'}
                              </p>
                              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">{order.customerInfo.name}</p>
                              <p className="text-[10px] text-neutral-500 leading-tight mt-0.5">{order.customerInfo.address}</p>
                              <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mt-1">{order.customerInfo.phone}</p>
                            </div>
                          </div>

                          {/* Items List */}
                          <div className="space-y-3 mb-6">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                              <ShoppingBag size={12} /> {language === 'bn' ? 'অর্ডার আইটেম' : 'Order Items'}
                            </p>
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0">
                                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-grow min-w-0">
                                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">{item.name}</p>
                                  <p className="text-xs text-neutral-400 font-medium">৳{item.price} × {item.quantity}</p>
                                </div>
                                <p className="text-sm font-black text-neutral-900 dark:text-white">৳{item.price * item.quantity}</p>
                              </div>
                            ))}
                          </div>

                          {/* Steadfast / Parcel Tracking Information */}
                          {(order.steadfastTrackingCode || order.trackingLink) && (
                            <div className="mb-6 p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                  <Truck size={16} />
                                  <span className="text-xs font-black uppercase tracking-wider">
                                    {language === 'bn' ? 'কুরিয়ার ডেলিভারি ট্র্যাকিং' : 'Courier Live Tracking'}
                                  </span>
                                </div>
                                {order.steadfastStatus && (
                                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-500 text-white">
                                    {typeof formatSteadfastStatus(order.steadfastStatus, language === 'bn' ? 'bn' : 'en') === 'object' 
                                      ? formatSteadfastStatus(order.steadfastStatus, language === 'bn' ? 'bn' : 'en').label 
                                      : order.steadfastStatus}
                                  </span>
                                )}
                              </div>

                              {order.steadfastTrackingCode && (
                                <div className="flex items-center justify-between text-xs bg-white dark:bg-neutral-800/80 px-3 py-2 rounded-xl">
                                  <span className="text-neutral-400 font-medium text-[11px]">{language === 'bn' ? 'ট্র্যাকিং কোড:' : 'Tracking Code:'}</span>
                                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{order.steadfastTrackingCode}</span>
                                </div>
                              )}

                              {order.trackingLink && (
                                <a 
                                  href={order.trackingLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-center text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                  <ExternalLink size={13} /> 
                                  <span>{language === 'bn' ? 'লাইভ পার্সেল ট্র্যাক করুন' : 'Track Parcel Live'}</span>
                                </a>
                              )}
                            </div>
                          )}

                          {/* Price Breakdown */}
                          <div className="bg-neutral-50 dark:bg-neutral-800/30 p-4 rounded-2xl space-y-2">
                             <div className="flex justify-between text-xs text-neutral-500 font-bold">
                                <span>{language === 'bn' ? 'সাবটোটাল' : 'Subtotal'}</span>
                                <span>৳{order.total - (order.deliveryFee || 0) - (order.serviceCharge || 0)}</span>
                             </div>
                             {order.deliveryFee !== undefined && (
                               <div className="flex justify-between text-xs text-neutral-500 font-bold">
                                  <span>{language === 'bn' ? 'ডেলিভারি ফি' : 'Delivery Fee'}</span>
                                  <span>৳{order.deliveryFee}</span>
                               </div>
                             )}
                             {order.serviceCharge !== undefined && (
                               <div className="flex justify-between text-xs text-neutral-500 font-bold">
                                  <span>{language === 'bn' ? 'সার্ভিস চার্জ' : 'Service Charge'}</span>
                                  <span>৳{order.serviceCharge}</span>
                               </div>
                             )}
                             <div className="flex justify-between items-center pt-2 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                                <span className="text-sm font-black text-neutral-900 dark:text-white">{language === 'bn' ? 'মোট' : 'Total'}</span>
                                <span className="text-xl font-black text-primary">৳{order.total}</span>
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        );

      case "addresses":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white underline decoration-primary decoration-4 underline-offset-8">{t("address")}</h2>
            </div>
            
            {addresses.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 p-12 rounded-[2.5rem] border border-dashed border-neutral-200 dark:border-neutral-800 text-center">
                <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-300">
                  <MapPin size={32} />
                </div>
                <p className="text-neutral-500 dark:text-neutral-400 font-bold">
                  {language === 'bn' ? 'অর্ডার করলে আপনার ঠিকানা এখানে সংরক্ষিত হবে' : 'Your address will be saved here after ordering'}
                </p>
              </div>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm relative group transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/5 dark:bg-primary/10 text-primary rounded-lg">
                      <MapPin size={18} />
                    </div>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{addr.type}</span>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">{addr.address}</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-neutral-200">{addr.phone}</p>
                  
                  <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => deleteAddress(addr.id)}
                      className="p-2 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case "wishlist":
        return (
          <div className="space-y-4">
             <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white underline decoration-primary decoration-4 underline-offset-8">{t("wishlist")}</h2>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{wishlistItems.length} {language === 'bn' ? 'আইটেম' : 'Items'}</span>
            </div>
            {wishlistItems.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 p-12 rounded-[2.5rem] border border-dashed border-neutral-200 dark:border-neutral-800 text-center">
                <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-300">
                  <Heart size={32} />
                </div>
                <p className="text-neutral-500 dark:text-neutral-400 font-bold">
                  {language === 'bn' ? 'আপনার উইশলিস্ট খালি' : 'Your wishlist is empty'}
                </p>
                <button 
                  onClick={() => navigate("/")}
                  className="mt-6 text-primary font-black text-sm hover:underline"
                >
                  {language === 'bn' ? 'শপিং শুরু করুন' : 'Start Shopping'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wishlistItems.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm flex items-center gap-4 group transition-colors">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => navigate(`/product/${item.id}`)}>
                      <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-neutral-800 dark:text-neutral-100 text-sm mb-1">{item.name}</h4>
                      <p className="font-black text-primary">৳{item.price}</p>
                      <button 
                        onClick={() => toggleWishlist(item.id)}
                        className="mt-2 text-[10px] uppercase font-bold text-red-500 hover:scale-105 active:scale-95 transition-transform"
                      >
                        {language === 'bn' ? 'সরিয়ে ফেলুন' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-6 underline decoration-primary decoration-4 underline-offset-8">{t("settings")}</h2>
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-50 dark:divide-neutral-800 shadow-sm">
              {/* Notifications */}
              <div 
                onClick={() => {
                  setNotifications(!notifications);
                  if (!notifications) {
                    alert(language === "bn" ? "নোটিফিকেশন অন করা হয়েছে!" : "Notifications turned ON!");
                  }
                }}
                className="flex items-center justify-between p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                   <div className="p-2.5 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-xl">
                      <Bell size={18} />
                   </div>
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">{t("notifications")}</span>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-all ${notifications ? 'bg-green-500' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
              </div>

              {/* Language */}
              <div 
                onClick={() => setLanguage(language === "bn" ? "en" : "bn")}
                className="flex items-center justify-between p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                   <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl">
                      <Globe size={18} />
                   </div>
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">{t("language")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{language === "bn" ? "বাংলা" : "English"}</span>
                  <ChevronRight size={16} className="text-neutral-300" />
                </div>
              </div>

              {/* Dark Mode */}
              <div 
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="flex items-center justify-between p-5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                   <div className={`p-2.5 rounded-xl transition-colors ${theme === 'dark' ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                      <Moon size={18} />
                   </div>
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">{t("dark_mode")}</span>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-all ${theme === 'dark' ? 'bg-primary' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
              </div>

              {/* Account Verification */}
              <div className="flex items-center justify-between p-5 opacity-80 cursor-not-allowed bg-neutral-50/30 dark:bg-neutral-800/10">
                <div className="flex items-center gap-4">
                   <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                      <User size={18} />
                   </div>
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">{t("verification")}</span>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${userProfile?.isVerified ? 'text-primary bg-primary/10' : 'text-neutral-400 bg-neutral-100'}`}>
                  {userProfile?.isVerified ? (language === 'bn' ? 'সম্পন্ন' : 'Verified') : (language === 'bn' ? 'অসম্পূর্ণ' : 'Unverified')}
                </span>
              </div>
            </div>
          </div>
        );

        case "editProfile":
          return (
            <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 shadow-sm border border-neutral-100 dark:border-neutral-800 transition-colors">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white underline decoration-primary decoration-4 underline-offset-8 mb-8">{t("edit_profile")}</h2>
              <form 
                className="space-y-6" 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user) return;
                  
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get("name") as string;
                  const phone = formData.get("phone") as string;
                  const dob = formData.get("dob") as string;
                  
                  try {
                    await updateDoc(doc(db, "users", user.uid), {
                      displayName: name,
                      phone: phone,
                      dob: dob,
                      updatedAt: new Date().toISOString()
                    });
                    setActiveTab("main");
                  } catch (err) {
                    handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
                  }
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">{language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}</label>
                    <input 
                      name="name"
                      type="text" 
                      defaultValue={userProfile?.displayName || user?.displayName || ''} 
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-neutral-100" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">{language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}</label>
                    <input 
                      type="email" 
                      disabled
                      defaultValue={user?.email || ''} 
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-2xl p-4 text-sm opacity-50 cursor-not-allowed dark:text-neutral-400" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">{language === 'bn' ? 'ফোন নাম্বার' : 'Phone Number'}</label>
                    <input 
                      name="phone"
                      type="tel" 
                      defaultValue={userProfile?.phone || ''} 
                      placeholder="+8801234567890"
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-neutral-100" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase ml-1">{language === 'bn' ? 'জন্ম তারিখ' : 'Date of Birth'}</label>
                    <input 
                      name="dob"
                      type="date" 
                      defaultValue={userProfile?.dob || ''}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-neutral-100 font-mono" 
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button type="submit" className="flex-grow bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl transition-all">{t("save_changes")}</button>
                  <button type="button" onClick={() => setActiveTab("main")} className="px-8 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-bold rounded-2xl transition-colors">{t("cancel")}</button>
                </div>
              </form>
            </div>
          );

      default:
        return (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 shadow-sm border border-neutral-100 dark:border-neutral-800 mb-8 transition-colors"
            >
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-white dark:border-neutral-800 shadow-xl flex items-center justify-center text-primary relative overflow-hidden transition-colors">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} />
                  )}
                </div>
                <div className="text-center md:text-left flex-grow">
                  <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
                    {user?.displayName || (language === 'bn' ? 'গেস্ট ইউজার' : 'Guest User')}
                  </h1>
                  <p className="text-neutral-500 text-sm">{user?.email || (language === 'bn' ? 'লগ ইন করুন' : 'Please log in')}</p>
                  <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                    {isAdmin && <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-3 py-1 rounded-full">Administrator</span>}
                    {user && (
                      userProfile?.isVerified ? (
                        <span className="bg-green-100 dark:bg-green-500/10 text-green-600 text-[10px] uppercase font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Check size={10} /> {language === 'bn' ? 'ভেরিফাইড' : 'Verified'}
                        </span>
                      ) : (
                        <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-400 text-[10px] uppercase font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Ban size={10} /> {language === 'bn' ? 'অনভেরিফাইড' : 'Unverified'}
                        </span>
                      )
                    )}
                  </div>
                </div>
                {user ? (
                  <button 
                    onClick={() => setActiveTab("editProfile")}
                    className="bg-neutral-100 dark:bg-neutral-800 hover:bg-primary hover:text-white transition-all text-neutral-600 dark:text-neutral-400 font-bold px-6 py-2 rounded-xl text-sm shadow-sm"
                  >
                    {t("edit_profile")}
                  </button>
                ) : (
                  <button 
                    onClick={() => loginWithGoogle()}
                    className="bg-primary text-white font-black px-8 py-3 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <LogIn size={18} /> {language === 'bn' ? 'লগ ইন' : 'Log In'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-neutral-50 dark:border-neutral-800">
                {stats.map((stat, i) => (
                  <button key={i} onClick={() => setActiveTab(stat.tab)} className="text-center hover:bg-neutral-50 dark:hover:bg-neutral-800 p-2 rounded-2xl transition-colors">
                    <div className="flex items-center justify-center text-primary mb-1">
                      {stat.icon}
                    </div>
                    <p className="text-xl font-black text-neutral-900 dark:text-white">{stat.value}</p>
                    <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">{stat.label}</p>
                  </button>
                ))}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              {menuOptions.map((option, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setActiveTab(option.id)}
                  className="flex items-center justify-between p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl group-hover:scale-110 transition-transform">
                      {option.icon}
                    </div>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{option.name}</span>
                  </div>
                  <ChevronRight size={18} className="text-neutral-300 group-hover:text-primary transition-colors" />
                </motion.button>
              ))}
            </div>

            {user && (
              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 p-6 text-red-500 font-black hover:bg-red-50 dark:hover:bg-red-500/10 border-2 border-dashed border-red-100 dark:border-red-500/20 rounded-[2rem] transition-colors"
              >
                <LogOut size={22} />
                {t("logout")}
              </motion.button>
            )}
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow bg-neutral-50 dark:bg-neutral-950 py-8 md:py-12 pb-28 md:pb-16 transition-colors">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between mb-6">
            <AnimatePresence mode="wait">
              {activeTab !== "main" ? (
                <motion.button
                  key="back-profile"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => setActiveTab("main")}
                  className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-primary transition-colors font-bold text-sm"
                >
                  <ArrowLeft size={16} /> {t("back_to_profile")}
                </motion.button>
              ) : (
                <motion.button
                  key="back-history"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-primary transition-colors font-bold text-sm bg-white dark:bg-neutral-900 px-4 py-2 rounded-full shadow-sm"
                >
                  <ArrowLeft size={16} /> {t("back_to_page")}
                </motion.button>
              )}
            </AnimatePresence>

            {activeTab === "main" && (
              <p className="text-xs font-bold text-neutral-300 dark:text-neutral-600 uppercase tracking-widest hidden sm:block">{t("profile")}</p>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
