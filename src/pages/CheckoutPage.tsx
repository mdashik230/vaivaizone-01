import React, { useState, useEffect } from "react";
import { ChevronLeft, Truck, MapPin, Phone, User, CreditCard, ShieldCheck, AlertCircle, CheckCircle2, ShoppingCart, Ban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { useOrders, Order } from "../context/OrderContext";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";
import { sendTelegramNotification, escapeTelegramHtml } from "../utils/telegram";
import { createSteadfastOrder, getSteadfastTrackingUrl } from "../utils/steadfast";

// Comprehensive location data for Bangladesh
const BD_LOCATIONS = {
  divisions: ["Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh"],
  districts: {
    "Dhaka": ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Manikganj", "Munshiganj", "Narsingdi", "Faridpur", "Gopalganj", "Madaripur", "Rajbari", "Shariatpur"],
    "Chattogram": ["Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Brahmanbaria", "Noakhali", "Lakshmipur", "Chandpur", "Khagrachhari", "Rangamati", "Bandarban"],
    "Rajshahi": ["Rajshahi", "Bogura", "Pabna", "Naogaon", "Joypurhat", "Chapai Nawabganj", "Natore", "Sirajganj"],
    "Khulna": ["Khulna", "Jashore", "Satkhira", "Bagerhat", "Kushtia", "Meherpur", "Chuadanga", "Jhenaidah", "Magura", "Narail"],
    "Barishal": ["Barishal", "Patuakhali", "Bhola", "Pirojpur", "Barguna", "Jhalokathi"],
    "Sylhet": ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
    "Rangpur": ["Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Nilphamari", "Panchagarh", "Thakurgaon", "Lalmonirhat"],
    "Mymensingh": ["Mymensingh", "Netrokona", "Sherpur", "Jamalpur"]
  },
  upazilas: {
    "Dhaka": ["Dhanmondi", "Gulshan", "Uttara", "Mirpur", "Banani", "Mohammadpur", "Badda", "Savar", "Dhamrai", "Keraniganj", "Ashulia", "Pallabi", "Demra", "Hazaribagh", "Kotwali", "Sutrapur", "Tejgaon", "Khilgaon", "Cantonment", "Motijheel"],
    "Gazipur": ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur", "Tongi"],
    "Narayanganj": ["Narayanganj Sadar", "Bandar", "Araihazar", "Sonargaon", "Rupganj", "Siddhirganj"],
    "Tangail": ["Tangail Sadar", "Sakhipur", "Basail", "Madhupur", "Ghatail", "Kalihati", "Nagarpur", "Mirzapur", "Gopalpur", "Delduar", "Bhuapur", "Dhanbari"],
    "Manikganj": ["Manikganj Sadar", "Singair", "Shivalaya", "Saturia", "Harirampur", "Gheor", "Daulatpur"],
    "Munshiganj": ["Munshiganj Sadar", "Sreenagar", "Sirajdikhan", "Lauhajang", "Gazaria", "Tongibari"],
    "Narsingdi": ["Narsingdi Sadar", "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur"],
    "Faridpur": ["Faridpur Sadar", "Bhanga", "Boalmari", "Alfadanga", "Madhukhali", "Nagarkanda", "Sadarpur", "Charbhadrasan", "Saltha"],
    "Cumilla": ["Cumilla Sadar", "Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna", "Laksam", "Muradnagar", "Nangalkot", "Titas", "Meghna", "Monohargonj"],
    "Chattogram": ["Chattogram Sadar", "Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Fatikchhari", "Hathazari", "Lohagara", "Mirsharai", "Patiya", "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda"],
    "Bogura": ["Bogura Sadar", "Adamdighi", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Sherpur", "Shibganj", "Sonatola"],
    "Sylhet": ["Sylhet Sadar", "Beanibazar", "Bishwanath", "Dakshin Surma", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Zakiganj"],
    "Mymensingh": ["Mymensingh Sadar", "Bhaluka", "Fulbaria", "Gaffargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Muktagacha", "Nandail", "Phulpur", "Trishal", "Tara Khanda"]
  }
};

const SPECIAL_AREAS = ["বড়িবাড়ী", "কপালেশ্বহর", "নামিলা", "সোহাগপুর", "ঝাউয়াদি", "নরদা"];

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { language, t } = useSettings();
  const { contactInfo, shippingSettings, telegramSettings, steadfastSettings } = useAdmin();
  const navigate = useNavigate();
  const { addOrder, orders, updateOrder } = useOrders();
  const { user } = useAuth();

  // Find the most recent address from previous orders
  const lastOrderWithAddress = orders.find(o => o.customerInfo && o.customerInfo.address);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    division: "",
    district: "",
    upazila: "",
    note: "",
    transactionId: "",
    lastNumber: ""
  });

  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [onlineProvider, setOnlineProvider] = useState<"bkash" | "nagad" | "rocket" | "">("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({ trxId: "", last4: "" });

  useEffect(() => {
    if (showSuccess) {
      window.scrollTo(0, 0);
      const timer = setTimeout(() => {
        navigate("/");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, navigate]);

  const subtotal = cart.reduce((acc, item) => {
    const itemPrice = Number(item.price) || 0;
    return acc + (itemPrice * item.quantity);
  }, 0);
  
  const getDeliveryFee = () => {
    // Free delivery threshold check
    if (subtotal >= (shippingSettings.freeDeliveryThreshold || 2000)) return 0;
    
    // Auto calculate based on district
    if (formData.district === "Dhaka") {
      return shippingSettings.insideDhakaFee || 60;
    }
    
    if (formData.district) {
      return shippingSettings.outsideDhakaFee || 120;
    }

    return shippingSettings.defaultFee || 60;
  };

  const deliveryFee = getDeliveryFee();
  const codFee = paymentMethod === "cod" ? 20 : 0;
  const isMixedCart = false;
  const total = Number(subtotal + deliveryFee + codFee) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMixedCart) return;
    
    if (isNaN(total) || total <= 0) {
      alert(language === 'bn' ? "অর্ডার ভ্যালু সঠিক নয়। দয়া করে আবার চেষ্টা করুন।" : "Invalid order total. Please try again.");
      return;
    }

    if (!user) {
      alert(language === 'bn' ? "অর্ডার করতে দয়া করে লগইন করুন" : "Please login to place an order");
      navigate("/login?redirect=/checkout");
      return;
    }

    if (paymentMethod === "online" && !onlineProvider) {
      alert(language === 'bn' ? "দয়া করে একটি অনলাইন পেমেন্ট মাধ্যম নির্বাচন করুন" : "Please select an online payment provider");
      return;
    }

    if (paymentMethod === "online") {
      setShowPaymentModal(true);
    } else {
      processOrder();
    }
  };

  const processOrder = async (extraData?: { trxId?: string, last4?: string }) => {
    const orderData: Omit<Order, 'id'> = {
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'Pending',
      total: Number(total),
      deliveryFee: Number(deliveryFee),
      serviceCharge: Number(codFee),
      items: cart.map(item => ({
        id: String(item.id),
        name: String(item.name || "Product"),
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        image: String(item.image || "https://placehold.co/100")
      })),
      customerInfo: {
        name: String(formData.name),
        phone: String(formData.phone),
        address: String(formData.address),
        area: String(`${formData.upazila}, ${formData.district}, ${formData.division}`)
      },
      paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : onlineProvider.toUpperCase(),
      transactionId: paymentMethod === 'online' ? String(extraData?.trxId || formData.transactionId || "") : "",
      lastNumber: paymentMethod === 'online' ? String(extraData?.last4 || formData.lastNumber || "") : ""
    };

    try {
      const orderId = await addOrder(orderData);
      
      // Send Telegram Notification
      if (telegramSettings.isEnabled && telegramSettings.botToken && telegramSettings.chatId) {
        const orderMsg = `
<b>🛍️ New Order Received!</b>
<b>Order ID:</b> ${orderId}
<b>Customer:</b> ${escapeTelegramHtml(orderData.customerInfo.name)}
<b>Phone:</b> ${escapeTelegramHtml(orderData.customerInfo.phone)}
<b>Total:</b> ৳${orderData.total}
<b>Method:</b> ${escapeTelegramHtml(orderData.paymentMethod)}
<b>Address:</b> ${escapeTelegramHtml(orderData.customerInfo.address)}
<b>Area:</b> ${escapeTelegramHtml(orderData.customerInfo.area)}

<b>Items:</b>
${orderData.items.map(item => `- ${escapeTelegramHtml(item.name)} x${item.quantity} (৳${item.price})`).join('\n')}
        `.trim();
        sendTelegramNotification(telegramSettings.botToken, telegramSettings.chatId, orderMsg);
      }

      // Auto-book Steadfast Courier if enabled
      if (steadfastSettings?.isEnabled && steadfastSettings?.autoBooking && steadfastSettings?.apiKey && steadfastSettings?.secretKey) {
        try {
          const invoice = `INV-${orderId.slice(-6).toUpperCase()}`;
          const sfRes = await createSteadfastOrder({
            invoice,
            recipient_name: String(formData.name),
            recipient_phone: String(formData.phone),
            recipient_address: `${String(formData.address)}, ${String(formData.upazila)}, ${String(formData.district)}`,
            cod_amount: paymentMethod === 'cod' ? Number(total) : 0,
            note: steadfastSettings.defaultNote || 'Handle with Care',
          }, {
            apiKey: steadfastSettings.apiKey,
            secretKey: steadfastSettings.secretKey,
          });

          if (sfRes.status === 200 && sfRes.consignment) {
            const trackingCode = sfRes.consignment.tracking_code;
            const consignmentId = sfRes.consignment.consignment_id;
            const trackingUrl = getSteadfastTrackingUrl(trackingCode);
            await updateOrder(orderId, {
              steadfastConsignmentId: consignmentId,
              steadfastTrackingCode: trackingCode,
              steadfastStatus: sfRes.consignment.status || 'in_review',
              steadfastBookedAt: new Date().toISOString(),
              steadfastNote: steadfastSettings.defaultNote || 'Handle with Care',
              trackingLink: trackingUrl,
              status: 'Processing',
            });
          }
        } catch (sfErr) {
          console.error("Auto Steadfast booking error:", sfErr);
        }
      }
      
      // Save address for future use
      const newAddress = {
        id: Date.now(),
        type: "Shipping Address",
        address: formData.address,
        phone: formData.phone
      };

      try {
        const saved = localStorage.getItem("user_addresses");
        let savedAddresses = saved ? JSON.parse(saved) : [];
        if (!Array.isArray(savedAddresses)) savedAddresses = [];
        
        const isDuplicate = savedAddresses.some((a: any) => (a.address + a.phone) === (formData.address + formData.phone));
        if (!isDuplicate) {
          localStorage.setItem("user_addresses", JSON.stringify([newAddress, ...savedAddresses].slice(0, 5)));
        }
      } catch (e) {
        console.error("Address save error", e);
      }

      clearCart();
      setShowSuccess(true);
    } catch (error: any) {
      console.error("Order process error:", error);
      alert(language === 'bn' ? "অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" : "Something went wrong. Please try again.");
    }
  };

  const handlePaymentConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const extra = { 
      trxId: paymentDetails.trxId, 
      last4: paymentDetails.last4 
    };
    setFormData(prev => ({
      ...prev,
      transactionId: extra.trxId,
      lastNumber: extra.last4
    }));
    setShowPaymentModal(false);
    processOrder(extra);
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert(language === 'bn' ? "নম্বরটি কপি করা হয়েছে!" : "Number copied!");
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert(language === 'bn' ? "নম্বরটি কপি করা হয়েছে!" : "Number copied!");
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col font-sans dark:bg-neutral-950 transition-colors">
        <Header />
        <main className="flex-grow flex items-center justify-center py-20 px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white dark:bg-neutral-900 p-12 rounded-[3.5rem] border border-neutral-100 dark:border-neutral-800 shadow-2xl text-center"
          >
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/20">
              <CheckCircle2 size={48} className="text-white" />
            </div>
            <h2 className="text-3xl font-black text-neutral-900 dark:text-white mb-4">
              {language === 'bn' ? "অর্ডার সফল হয়েছে!" : "Order Placed Successfully!"}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-10 leading-relaxed">
              {language === 'bn' 
                ? "আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।" 
                : "Your order has been received. Our representative will contact you shortly."}
            </p>
            <div className="text-xs text-neutral-400 font-bold uppercase tracking-widest animate-pulse">
              {language === 'bn' ? "৫ সেকেন্ড পর হোম পেজে রিডাইরেক্ট করা হবে..." : "Redirecting to home in 5 seconds..."}
            </div>
            <button 
              onClick={() => navigate("/")}
              className="w-full mt-6 bg-primary text-white py-5 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              {language === 'bn' ? "এখনই ফিরে যান" : "Go Back Now"}
            </button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans dark:bg-neutral-950 transition-colors">
      <Header />
      <main className="flex-grow py-8 pb-32">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white">
              {language === 'bn' ? "অর্ডার সম্পন্ন করুন" : "Complete Your Order"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Validation Alert removed as logic is simplified */}

              <div className={`p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-sm ${isMixedCart ? "opacity-50 pointer-events-none" : ""}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className="text-primary" />
                    {language === 'bn' ? "ডেলিভারি তথ্য" : "Delivery Information"}
                  </div>
                  
                  {lastOrderWithAddress && (
                    <button 
                      type="button"
                      onClick={() => {
                        const info = lastOrderWithAddress.customerInfo;
                        const areaParts = (info.area || "").split(",").map(p => p.trim());
                        setFormData({
                          ...formData,
                          name: info.name,
                          phone: info.phone,
                          address: info.address,
                          division: areaParts[2] || "",
                          district: areaParts[1] || "",
                          upazila: areaParts[0] || ""
                        });
                      }}
                      className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                    >
                      <Truck size={12} />
                      {language === 'bn' ? "আগের ঠিকানা ব্যবহার করুন" : "Use Previous Address"}
                    </button>
                  )}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{language === 'bn' ? "নাম" : "Full Name"}</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder={language === 'bn' ? "আপনার নাম লিখুন" : "Full Name"}
                      className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{language === 'bn' ? "ফোন নম্বর" : "Phone Number"}</label>
                    <input 
                      required
                      type="tel" 
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder={language === 'bn' ? "০১৭XXXXXXXX" : "017XXXXXXXX"}
                      className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-4 md:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{language === 'bn' ? "বিভাগ" : "Division"}</label>
                        <select 
                          required
                          value={formData.division || ''}
                          onChange={(e) => setFormData({...formData, division: e.target.value, district: "", upazila: ""})}
                          className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                          <option value="">{language === 'bn' ? "বিভাগ নির্বাচন করুন" : "Select Division"}</option>
                          {BD_LOCATIONS.divisions.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{language === 'bn' ? "জেলা" : "District"}</label>
                        <select 
                          disabled={!formData.division}
                          required
                          value={formData.district || ''}
                          onChange={(e) => setFormData({...formData, district: e.target.value, upazila: ""})}
                          className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50"
                        >
                          <option value="">{language === 'bn' ? "জেলা নির্বাচন করুন" : "Select District"}</option>
                          {(BD_LOCATIONS.districts as any)[formData.division]?.map((d: string) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{language === 'bn' ? "উপজেলা/থানা" : "Upazila/Thana"}</label>
                        <select 
                          disabled={!formData.district}
                          required
                          value={formData.upazila || ''}
                          onChange={(e) => setFormData({...formData, upazila: e.target.value})}
                          className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50"
                        >
                          <option value="">{language === 'bn' ? "উপজেলা নির্বাচন করুন" : "Select Upazila"}</option>
                          {(BD_LOCATIONS.upazilas as any)[formData.district]?.map((u: string) => <option key={u} value={u}>{u}</option>) || null}
                          <option value="Other">{language === 'bn' ? "অন্যান্য" : "Other"}</option>
                        </select>
                      </div>
                    </div>

                    {formData.upazila === "Other" && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                          {language === 'bn' ? "উপজলার নাম লিখুন" : "Type Upazila Name"}
                        </label>
                        <input 
                          required
                          type="text"
                          onChange={(e) => setFormData({...formData, note: (formData.note || "") + "\nCustom Upazila: " + e.target.value})}
                          placeholder={language === 'bn' ? "উপজেলার নাম লিখুন" : "Type Upazila Name"}
                          className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary/20"
                        />
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{language === 'bn' ? "বিস্তারিত ঠিকানা" : "Detailed Address"}</label>
                    <textarea 
                      required
                      value={formData.address || ''}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder={language === 'bn' ? "বাসা নম্বর, সড়ক নম্বর..." : "House no, Street no..."}
                      className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className={`p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-sm ${isMixedCart ? "opacity-50 pointer-events-none" : ""}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" />
                  {language === 'bn' ? "পেমেন্ট পদ্ধতি" : "Payment Method"}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div 
                    onClick={() => setPaymentMethod("online")}
                    className={`relative flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all cursor-pointer ${
                      paymentMethod === "online" ? "border-primary bg-primary/5" : "border-neutral-100 dark:border-neutral-800"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === "online" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"}`}>
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <p className="font-bold">{language === 'bn' ? "অনলাইন পেমেন্ট" : "Online Payment"}</p>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{language === 'bn' ? "বিকাশ, নগদ, রকেট" : "bKash, Nagad, Rocket"}</p>
                    </div>
                    {paymentMethod === "online" && <CheckCircle2 size={20} className="ml-auto text-primary" />}
                  </div>

                  <div 
                    onClick={() => {
                      setPaymentMethod("cod");
                      setOnlineProvider("");
                    }}
                    className={`relative flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all cursor-pointer ${
                      paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-neutral-100 dark:border-neutral-800"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === "cod" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-neutral-100 dark:border-neutral-800 text-neutral-400"}`}>
                      <Truck size={24} />
                    </div>
                    <div>
                      <p className="font-bold">{language === 'bn' ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery"}</p>
                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">+৳২০ {language === 'bn' ? "সার্ভিস চার্জ" : "Service Charge"}</p>
                    </div>
                    {paymentMethod === "cod" && <CheckCircle2 size={20} className="ml-auto text-primary" />}
                  </div>
                </div>

                <AnimatePresence>
                  {paymentMethod === "online" && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-3 gap-4 pt-2">
                        {[
                          { id: "bkash", color: "bg-[#D12053]", label: "bKash" },
                          { id: "nagad", color: "bg-[#F7941D]", label: "Nagad" },
                          { id: "rocket", color: "bg-[#8C3494]", label: "Rocket" }
                        ].map(provider => (
                          <button
                            key={provider.id}
                            type="button"
                            onClick={() => setOnlineProvider(provider.id as any)}
                            className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden group ${
                              onlineProvider === provider.id ? "border-primary bg-primary/5 ring-4 ring-primary/5 shadow-inner" : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-200"
                            }`}
                          >
                            <div className={`w-12 h-12 ${provider.color} rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-md group-hover:scale-110 transition-transform`}>
                              {provider.label[0]}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{provider.label}</span>
                            {onlineProvider === provider.id && (
                              <div className="absolute top-0 right-0 p-1.5 bg-primary text-white rounded-bl-xl shadow-lg">
                                <CheckCircle2 size={12} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-xl lg:sticky lg:top-24">
                <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-6">
                  {language === 'bn' ? "সারসংক্ষেপ" : "Summary"}
                </h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-neutral-500 font-medium">
                    <span>{language === 'bn' ? "সাবটোটাল" : "Subtotal"}</span>
                    <span className="font-bold text-neutral-800 dark:text-white">৳{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500 font-medium">
                    <span>{language === 'bn' ? "ডেলিভারি চার্জ" : "Delivery Fee"}</span>
                    {subtotal >= (shippingSettings.freeDeliveryThreshold || 2000) ? (
                      <span className="font-black text-green-500 uppercase text-xs">{language === 'bn' ? "ফ্রি" : "Free"}</span>
                    ) : (
                      <span className={`font-black ${formData.district === "Dhaka" ? "text-green-500" : "text-neutral-800 dark:text-white"}`}>৳{deliveryFee}</span>
                    )}
                  </div>
                  <AnimatePresence>
                    {codFee > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex justify-between text-amber-600 font-bold bg-amber-50 dark:bg-amber-500/10 px-4 py-2.5 rounded-2xl"
                      >
                        <span className="text-sm uppercase tracking-wider">{language === 'bn' ? "ক্যাশ অন চার্জ" : "COD Charge"}</span>
                        <span>৳{codFee}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-4" />
                  <div className="flex justify-between items-end">
                    <span className="text-neutral-400 font-bold text-xs uppercase tracking-[0.2em]">{language === 'bn' ? "মোট পেমেন্ট" : "Total Amount"}</span>
                    <span className="text-3xl font-black text-primary">৳{total}</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isMixedCart}
                  className={`w-full py-5 rounded-[1.5rem] font-black text-lg shadow-lg flex items-center justify-center gap-3 group transition-all ${
                    isMixedCart 
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none" 
                      : "bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-95"
                  }`}
                >
                  {isMixedCart ? <Ban size={24} /> : <ShieldCheck size={24} className="group-hover:rotate-12 transition-transform" />}
                  {language === 'bn' ? "অর্ডার কনফার্ম করুন" : "Confirm Order"}
                </button>

                <div className="mt-8 p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
                  <div className="flex items-center gap-2 text-primary mb-3">
                    <AlertCircle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{language === 'bn' ? "পেমেন্ট টিপস" : "Payment Tips"}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-neutral-400 font-bold uppercase tracking-tight">
                    {language === 'bn' 
                      ? "অনলাইন পেমেন্ট করলে কোনো অতিরিক্ত চার্জ নেই। ক্যাশ অন ডেলিভারিতে ২০ টাকা সার্ভিস চার্জ যুক্ত হতে পারে।"
                      : "No extra fees for online payments. ৳20 COD charge may apply for cash on delivery."}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className={`p-4 rounded-2xl text-white shadow-xl ${
                  onlineProvider === 'bkash' ? 'bg-[#D12053]' : onlineProvider === 'nagad' ? 'bg-[#F7941D]' : 'bg-[#8C3494]'
                }`}>
                  <CreditCard size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-neutral-900 dark:text-white leading-tight">
                    {onlineProvider === 'bkash' ? 'bKash' : onlineProvider === 'nagad' ? 'Nagad' : 'Rocket'} {language === 'bn' ? 'পেমেন্ট' : 'Payment'}
                  </h3>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    {language === 'bn' ? 'নিরাপদ পেমেন্ট গেটওয়ে' : 'Secure Payment Gateway'}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-neutral-50 dark:bg-neutral-800 rounded-3xl mb-8 border border-neutral-100 dark:border-neutral-700">
                <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3">
                  {language === 'bn' ? 'এই নম্বরে সেন্ড মানি করুন' : 'Send Money to this number'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-primary tracking-tighter">
                    {onlineProvider === 'bkash' ? contactInfo.paymentBkash : onlineProvider === 'nagad' ? contactInfo.paymentNagad : contactInfo.paymentRocket}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(onlineProvider === 'bkash' ? contactInfo.paymentBkash : onlineProvider === 'nagad' ? contactInfo.paymentNagad : contactInfo.paymentRocket)}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-black hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    {language === 'bn' ? 'কপি করুন' : 'Copy'}
                  </button>
                </div>
              </div>

              <form onSubmit={handlePaymentConfirm} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">
                    {language === 'bn' ? 'ট্রানজেকশন আইডি' : 'Transaction ID'}
                  </label>
                  <input 
                    required
                    type="text"
                    value={paymentDetails.trxId || ''}
                    onChange={(e) => setPaymentDetails({...paymentDetails, trxId: e.target.value})}
                    placeholder="TRX123456789"
                    className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-4 focus:ring-primary/10 font-bold placeholder:opacity-30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">
                    {language === 'bn' ? 'নম্বরের শেষ ৪ সংখ্যা' : 'Last 4 Digits'}
                  </label>
                  <input 
                    required
                    type="text"
                    maxLength={4}
                    value={paymentDetails.last4 || ''}
                    onChange={(e) => setPaymentDetails({...paymentDetails, last4: e.target.value})}
                    placeholder="1234"
                    className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-4 focus:ring-primary/10 font-bold placeholder:opacity-30"
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-5 rounded-2xl font-black text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-primary text-white py-5 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {language === 'bn' ? 'নিশ্চিত করুন' : 'Confirm'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
