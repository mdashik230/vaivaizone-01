import React, { useState, useEffect } from "react";
import { ChevronLeft, Truck, MapPin, Phone, User, CreditCard, ShieldCheck, AlertCircle, CheckCircle2, ShoppingCart, Ban, Zap, Loader2, ArrowRight, ExternalLink, BookmarkCheck, Check, ChevronDown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Header from "../components/Header";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { useOrders, Order } from "../context/OrderContext";
import { useAdmin } from "../context/AdminContext";
import { useAuth, UserSavedAddress } from "../context/AuthContext";
import { sendTelegramNotification, escapeTelegramHtml } from "../utils/telegram";
import { createSteadfastOrder, getSteadfastTrackingUrl } from "../utils/steadfast";
import { createUddoktaPayCharge } from "../utils/uddoktapay";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { BD_DIVISIONS, BD_DISTRICTS, BD_UPAZILAS } from "../data/bangladeshLocations";

const SPECIAL_AREAS = ["বড়িবাড়ী", "কপালেশ্বহর", "নামিলা", "সোহাগপুর", "ঝাউয়াদি", "নরদা"];

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { language, t } = useSettings();
  const { contactInfo, shippingSettings, telegramSettings, steadfastSettings, uddoktaPaySettings } = useAdmin();
  const navigate = useNavigate();
  const { addOrder, orders, updateOrder } = useOrders();
  const { user, userProfile } = useAuth();

  const isUddoktaPayActive = Boolean(
    uddoktaPaySettings?.apiKey?.trim() && 
    (uddoktaPaySettings.isEnabled !== false || (uddoktaPaySettings.apiKey && uddoktaPaySettings.apiKey.length > 8))
  );

  // Find the most recent address from previous orders as intelligent fallback
  const lastOrderWithAddress = orders.find(o => o.customerInfo && o.customerInfo.address);

  // List of saved addresses from user's profile and storage
  const [profileAddresses, setProfileAddresses] = useState<UserSavedAddress[]>([]);
  const [addressAppliedToast, setAddressAppliedToast] = useState<string | null>(null);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // Load and assemble all saved profile addresses
  useEffect(() => {
    const list: UserSavedAddress[] = [];

    // 1. From Firestore userProfile
    if (userProfile?.addresses && Array.isArray(userProfile.addresses) && userProfile.addresses.length > 0) {
      userProfile.addresses.forEach((a, idx) => {
        if (a && a.address && !list.some(existing => existing.address.trim() === a.address.trim())) {
          list.push({
            id: a.id || `profile_${idx}`,
            type: a.type || (language === 'bn' ? 'বাসা' : 'Home'),
            name: a.name || userProfile.displayName || user?.displayName || '',
            phone: a.phone || userProfile.phone || '',
            address: a.address,
            division: a.division || '',
            district: a.district || '',
            upazila: a.upazila || '',
            customUpazila: a.customUpazila || '',
            isDefault: Boolean(a.isDefault)
          });
        }
      });
    }

    // 2. From userProfile single address if not already present
    if (userProfile?.address && !list.some(a => a.address.trim() === userProfile.address!.trim())) {
      list.push({
        id: 'profile_primary',
        type: language === 'bn' ? 'বাসা' : 'Home',
        name: userProfile.displayName || user?.displayName || '',
        phone: userProfile.phone || '',
        address: userProfile.address,
        division: userProfile.division || '',
        district: userProfile.district || '',
        upazila: userProfile.upazila || '',
        isDefault: true
      });
    }

    // 3. From localStorage user_addresses
    try {
      const saved = localStorage.getItem("user_addresses");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((a: any, idx: number) => {
            if (a && a.address && !list.some(existing => existing.address.trim() === a.address.trim())) {
              list.push({
                id: a.id || `local_${idx}`,
                type: a.type || (language === 'bn' ? 'সেভ করা ঠিকানা' : 'Saved Address'),
                name: a.name || userProfile?.displayName || user?.displayName || '',
                phone: a.phone || userProfile?.phone || '',
                address: a.address,
                division: a.division || '',
                district: a.district || '',
                upazila: a.upazila || '',
                customUpazila: a.customUpazila || '',
                isDefault: Boolean(a.isDefault)
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn("Error parsing user_addresses:", e);
    }

    // 4. Fallback to previous order address if no saved profile addresses exist yet
    if (list.length === 0 && lastOrderWithAddress?.customerInfo?.address) {
      const info = lastOrderWithAddress.customerInfo;
      const areaParts = (info.area || "").split(",").map(p => p.trim());
      list.push({
        id: 'last_order',
        type: language === 'bn' ? 'আগের অর্ডারের ঠিকানা' : 'Previous Order',
        name: info.name || '',
        phone: info.phone || '',
        address: info.address || '',
        division: areaParts[2] || '',
        district: areaParts[1] || '',
        upazila: areaParts[0] || '',
        isDefault: true
      });
    }

    setProfileAddresses(list);
  }, [userProfile, user, lastOrderWithAddress, language]);

  // One-click autofill function for saved profile address
  const handleApplySavedAddress = (addr: UserSavedAddress) => {
    const division = addr.division || "";
    const district = addr.district || "";
    let upazila = addr.upazila || "";
    let customUpazila = addr.customUpazila || "";

    if (district && BD_UPAZILAS[district]) {
      const isKnown = BD_UPAZILAS[district].some(
        u => u.en.toLowerCase() === upazila.toLowerCase() || u.bn === upazila
      );
      if (!isKnown && upazila) {
        customUpazila = upazila;
        upazila = "Other";
      }
    }

    setFormData(prev => ({
      ...prev,
      name: addr.name || prev.name || userProfile?.displayName || user?.displayName || "",
      phone: addr.phone || prev.phone || userProfile?.phone || "",
      address: addr.address || prev.address,
      division: division,
      district: district,
      upazila: upazila,
      customUpazila: customUpazila
    }));

    const label = addr.type || (language === 'bn' ? 'প্রোফাইলের ঠিকানা' : 'Profile address');
    setAddressAppliedToast(
      language === 'bn' 
        ? `${label} ১-ক্লিকে সফলভাবে যুক্ত হয়েছে!` 
        : `${label} applied successfully in 1 click!`
    );
    setShowAddressDropdown(false);
    setTimeout(() => {
      setAddressAppliedToast(null);
    }, 3500);
  };

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    division: "",
    district: "",
    upazila: "",
    customUpazila: "",
    note: "",
    transactionId: "",
    lastNumber: ""
  });

  // Default to null so user explicitly selects Online Payment or Cash on Delivery
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod" | null>(null);
  const [onlineMode, setOnlineMode] = useState<"gateway" | "manual">("gateway");
  const [onlineProvider, setOnlineProvider] = useState<"bkash" | "nagad" | "rocket" | "">("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({ trxId: "", last4: "" });
  const [isRedirectingPayment, setIsRedirectingPayment] = useState(false);
  const [gatewayRedirectUrl, setGatewayRedirectUrl] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Auto-listen to the pending order status so if payment is completed in another tab, we automatically redirect
  useEffect(() => {
    if (!pendingOrderId) return;
    const unsub = onSnapshot(doc(db, "orders", pendingOrderId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.paymentStatus === 'paid' || data?.uddoktaPayStatus === 'COMPLETED') {
          setIsRedirectingPayment(false);
          navigate(`/payment-verify/${pendingOrderId}?status=COMPLETED`);
        }
      }
    }, (error) => {
      console.warn("Pending order snapshot observer:", error);
    });
    return () => unsub();
  }, [pendingOrderId, navigate]);

  useEffect(() => {
    if (isUddoktaPayActive) {
      setOnlineMode("gateway");
    } else {
      setOnlineMode("manual");
    }
  }, [isUddoktaPayActive]);

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

    if (!paymentMethod) {
      alert(language === 'bn' 
        ? "দয়া করে একটি পেমেন্ট পদ্ধতি নির্বাচন করুন (অনলাইন পেমেন্ট অথবা ক্যাশ অন ডেলিভারি)" 
        : "Please select a payment method (Online Payment or Cash on Delivery)");
      const paymentEl = document.getElementById("checkout-payment-section");
      if (paymentEl) {
        paymentEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (paymentMethod === "online") {
      if (isUddoktaPayActive && (onlineMode === "gateway" || !uddoktaPaySettings?.allowManualFallback)) {
        processOnlineGatewayOrder();
      } else {
        if (!onlineProvider) {
          alert(language === 'bn' ? "দয়া করে একটি অনলাইন পেমেন্ট মাধ্যম নির্বাচন করুন" : "Please select an online payment provider");
          return;
        }
        setShowPaymentModal(true);
      }
    } else {
      processOrder();
    }
  };

  const processOnlineGatewayOrder = async () => {
    const finalUpazila = formData.upazila === "Other" ? (formData.customUpazila?.trim() || "Other") : formData.upazila;
    if (!formData.name?.trim() || !formData.phone?.trim() || !formData.address?.trim() || !formData.division || !formData.district) {
      alert(language === 'bn' 
        ? "দয়া করে নাম, ফোন নম্বর, বিভাগ, জেলা এবং সম্পূর্ণ ঠিকানা পূরণ করুন" 
        : "Please fill in name, phone number, division, district, and address");
      return;
    }

    setIsRedirectingPayment(true);

    const orderData: Omit<Order, 'id'> = {
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'Pending',
      paymentStatus: 'unpaid',
      total: Number(total),
      deliveryFee: Number(deliveryFee),
      serviceCharge: 0,
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
        area: String(`${finalUpazila || ""}, ${formData.district}, ${formData.division}`)
      },
      paymentMethod: 'UddoktaPay (Online Auto)',
      uddoktaPayStatus: 'pending',
    };

    try {
      const orderId = await addOrder(orderData);
      setPendingOrderId(orderId);

      // Save to storage for seamless recovery
      try {
        sessionStorage.setItem("last_uddoktapay_order_id", orderId);
        localStorage.setItem("last_uddoktapay_order_id", orderId);
      } catch (e) {}

      const charge = await createUddoktaPayCharge({
        fullName: String(formData.name),
        email: user?.email || (formData.phone ? `${formData.phone}@customer.local` : 'customer@example.com'),
        amount: total,
        metadata: {
          order_id: orderId,
          phone: formData.phone,
        },
        redirectUrl: `${window.location.origin}/payment-verify/${orderId}`,
        cancelUrl: `${window.location.origin}/payment-verify/${orderId}?cancelled=true`,
      }, uddoktaPaySettings);

      if (charge.payment_url) {
        clearCart();
        setGatewayRedirectUrl(charge.payment_url);

        // Update order in Firestore with payment URL
        try {
          await updateOrder(orderId, {
            paymentGatewayUrl: charge.payment_url,
          });
        } catch (updateErr) {
          console.warn("Could not save paymentGatewayUrl to order:", updateErr);
        }

        const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
        if (isInIframe) {
          // Inside AI Studio iframe: UddoktaPay/Paymently blocks iframe embedding via X-Frame-Options: SAMEORIGIN
          // We immediately attempt to open in a new tab, and our interactive modal will be available as well
          try {
            const popup = window.open(charge.payment_url, '_blank', 'noopener,noreferrer');
            if (!popup) {
              console.log("Popup blocked by browser; user can click the button in modal.");
            }
          } catch (e) {
            console.warn("Could not auto-open new tab from iframe:", e);
          }
        } else {
          // In standard standalone tab or live domain, redirect directly
          window.location.href = charge.payment_url;
        }
      } else {
        throw new Error(charge.message || "Failed to get payment gateway URL");
      }
    } catch (err: any) {
      console.error("UddoktaPay checkout error:", err);
      alert(language === 'bn' 
        ? `পেমেন্ট গেটওয়েতে সংযোগ করতে সমস্যা হয়েছে: ${err.message || 'দয়া করে আবার চেষ্টা করুন'}` 
        : `Payment Gateway error: ${err.message || 'Please try again'}`);
      setIsRedirectingPayment(false);
    }
  };

  const processOrder = async (extraData?: { trxId?: string, last4?: string }) => {
    const finalUpazila = formData.upazila === "Other" ? (formData.customUpazila?.trim() || "Other") : formData.upazila;
    if (!formData.name?.trim() || !formData.phone?.trim() || !formData.address?.trim() || !formData.division || !formData.district) {
      alert(language === 'bn' 
        ? "দয়া করে নাম, ফোন নম্বর, বিভাগ, জেলা এবং সম্পূর্ণ ঠিকানা পূরণ করুন" 
        : "Please fill in name, phone number, division, district, and address");
      return;
    }

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
        area: String(`${finalUpazila || ""}, ${formData.district}, ${formData.division}`)
      },
      paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : (onlineProvider ? onlineProvider.toUpperCase() : 'Online Payment'),
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
      
      // Save address for future use and sync with profile
      const newAddress: UserSavedAddress = {
        id: Date.now(),
        type: language === 'bn' ? "বাসা" : "Home",
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        division: formData.division,
        district: formData.district,
        upazila: formData.upazila === "Other" && formData.customUpazila ? formData.customUpazila : formData.upazila,
        customUpazila: formData.customUpazila,
        isDefault: true
      };

      try {
        const saved = localStorage.getItem("user_addresses");
        let savedAddresses = saved ? JSON.parse(saved) : [];
        if (!Array.isArray(savedAddresses)) savedAddresses = [];
        
        const filtered = savedAddresses.filter((a: any) => a.address?.trim() !== formData.address.trim());
        const updatedList = [newAddress, ...filtered].slice(0, 5);
        localStorage.setItem("user_addresses", JSON.stringify(updatedList));

        if (user) {
          updateDoc(doc(db, "users", user.uid), {
            address: formData.address,
            phone: formData.phone,
            division: formData.division,
            district: formData.district,
            upazila: formData.upazila === "Other" && formData.customUpazila ? formData.customUpazila : formData.upazila,
            addresses: updatedList
          }).catch(e => console.warn("Background profile address sync skipped:", e));
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
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans dark:bg-neutral-950 transition-colors">
      <Header />
      <main className="flex-grow py-8 pb-28 md:pb-16">
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
                <h3 className="text-xl font-bold mb-6 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className="text-primary" />
                    {language === 'bn' ? "ডেলিভারি তথ্য" : "Delivery Information"}
                  </div>
                  
                  {/* One-click apply saved profile address button in place of previous address button */}
                  {profileAddresses.length > 0 && (
                    <div className="relative">
                      {profileAddresses.length === 1 ? (
                        <button 
                          type="button"
                          onClick={() => handleApplySavedAddress(profileAddresses[0])}
                          className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 group border border-primary/20"
                          title={language === 'bn' ? "প্রোফাইলের সেভ করা ঠিকানা ১ ক্লিকে ফর্মটিতে বসান" : "One-click autofill profile address"}
                        >
                          <BookmarkCheck size={14} className="group-hover:scale-110 transition-transform" />
                          <span>{language === 'bn' ? "সেভ করা ঠিকানা দিন" : "Use Saved Address"}</span>
                        </button>
                      ) : (
                        <div className="flex items-center shadow-sm rounded-xl border border-primary/20 bg-primary/10 overflow-hidden">
                          <button 
                            type="button"
                            onClick={() => handleApplySavedAddress(profileAddresses[0])}
                            className="text-xs font-bold text-primary hover:bg-primary hover:text-white px-3 py-1.5 transition-all flex items-center gap-1.5 active:scale-95 group"
                            title={language === 'bn' ? `${profileAddresses[0].type || 'প্রধান'} ঠিকানা ১ ক্লিকে বসান` : "Use primary saved address"}
                          >
                            <BookmarkCheck size={14} className="group-hover:scale-110 transition-transform" />
                            <span>{language === 'bn' ? "সেভ করা ঠিকানা দিন" : "Use Saved Address"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddressDropdown(prev => !prev)}
                            className="text-primary hover:bg-primary hover:text-white px-2 py-1.5 transition-all border-l border-primary/20"
                            title={language === 'bn' ? "অন্যান্য সেভ করা ঠিকানা দেখুন" : "View other saved addresses"}
                            aria-label="Toggle address list"
                          >
                            <ChevronDown size={14} className={`transition-transform duration-200 ${showAddressDropdown ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      )}

                      {/* Dropdown menu for multiple saved addresses */}
                      {showAddressDropdown && profileAddresses.length > 1 && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="px-3 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                            <span>{language === 'bn' ? 'সেভ করা ঠিকানাসমূহ' : 'Saved Addresses'}</span>
                            <span className="text-primary font-bold">{profileAddresses.length}</span>
                          </div>
                          <div className="max-h-60 overflow-y-auto space-y-1 py-1.5">
                            {profileAddresses.map((addr) => (
                              <button
                                key={addr.id}
                                type="button"
                                onClick={() => handleApplySavedAddress(addr)}
                                className="w-full text-left p-2.5 rounded-xl hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors group flex items-start gap-2.5"
                              >
                                <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                                  <MapPin size={13} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200 truncate">
                                      {addr.type || 'ঠিকানা'}
                                    </span>
                                    {addr.phone && (
                                      <span className="text-[10px] font-mono text-neutral-400">{addr.phone}</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                                    {addr.address}
                                  </p>
                                  {(addr.upazila || addr.district || addr.division) && (
                                    <span className="inline-block text-[9px] font-bold text-primary mt-0.5">
                                      {[addr.upazila, addr.district, addr.division].filter(Boolean).join(", ")}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </h3>

                {/* Instant Feedback Banner when address is applied */}
                {addressAppliedToast && (
                  <motion.div 
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold"
                  >
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>{addressAppliedToast}</span>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="checkout-customer-name" className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{language === 'bn' ? "নাম" : "Full Name"}</label>
                    <input 
                      id="checkout-customer-name"
                      required
                      type="text" 
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder={language === 'bn' ? "আপনার নাম লিখুন" : "Full Name"}
                      aria-label={language === 'bn' ? "আপনার নাম" : "Full Name"}
                      className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary/20 text-base font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="checkout-customer-phone" className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{language === 'bn' ? "ফোন নম্বর" : "Phone Number"}</label>
                    <input 
                      id="checkout-customer-phone"
                      required
                      type="tel" 
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder={language === 'bn' ? "০১৭XXXXXXXX" : "017XXXXXXXX"}
                      aria-label={language === 'bn' ? "ফোন নম্বর" : "Phone Number"}
                      className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary/20 text-base font-medium"
                    />
                  </div>

                  <div className="space-y-4 md:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="checkout-customer-division" className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{language === 'bn' ? "বিভাগ" : "Division"}</label>
                        <select 
                          id="checkout-customer-division"
                          required
                          value={formData.division || ''}
                          onChange={(e) => setFormData({...formData, division: e.target.value, district: "", upazila: "", customUpazila: ""})}
                          aria-label={language === 'bn' ? "বিভাগ" : "Division"}
                          className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary/20 cursor-pointer text-base font-medium"
                        >
                          <option value="">{language === 'bn' ? "বিভাগ নির্বাচন করুন" : "Select Division"}</option>
                          {BD_DIVISIONS.map(d => (
                            <option key={d.en} value={d.en}>
                              {language === 'bn' ? `${d.bn} (${d.en})` : d.en}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="checkout-customer-district" className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{language === 'bn' ? "জেলা" : "District"}</label>
                        <select 
                          id="checkout-customer-district"
                          disabled={!formData.division}
                          required
                          value={formData.district || ''}
                          onChange={(e) => setFormData({...formData, district: e.target.value, upazila: "", customUpazila: ""})}
                          aria-label={language === 'bn' ? "জেলা" : "District"}
                          className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50 text-base font-medium"
                        >
                          <option value="">{language === 'bn' ? "জেলা নির্বাচন করুন" : "Select District"}</option>
                          {formData.division && BD_DISTRICTS[formData.division]?.map(d => (
                            <option key={d.en} value={d.en}>
                              {language === 'bn' ? `${d.bn} (${d.en})` : d.en}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="checkout-customer-upazila" className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{language === 'bn' ? "উপজেলা/থানা" : "Upazila/Thana"}</label>
                        <select 
                          id="checkout-customer-upazila"
                          disabled={!formData.district}
                          required
                          value={formData.upazila || ''}
                          onChange={(e) => setFormData({...formData, upazila: e.target.value, customUpazila: e.target.value === "Other" ? formData.customUpazila : ""})}
                          aria-label={language === 'bn' ? "উপজেলা বা থানা" : "Upazila or Thana"}
                          className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50 text-base font-medium"
                        >
                          <option value="">{language === 'bn' ? "উপজেলা/থানা নির্বাচন করুন" : "Select Upazila/Thana"}</option>
                          {formData.district && BD_UPAZILAS[formData.district]?.map(u => (
                            <option key={u.en} value={u.en}>
                              {language === 'bn' ? `${u.bn} (${u.en})` : u.en}
                            </option>
                          ))}
                          <option value="Other">{language === 'bn' ? "অন্যান্য (খুঁজে না পেলে লিখুন)" : "Other (Type manually)"}</option>
                        </select>
                      </div>
                    </div>

                    {formData.upazila === "Other" && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <label htmlFor="checkout-custom-upazila" className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                          {language === 'bn' ? "উপজেলার নাম লিখুন" : "Type Upazila Name"}
                        </label>
                        <input 
                          id="checkout-custom-upazila"
                          required
                          type="text"
                          value={formData.customUpazila || ""}
                          onChange={(e) => setFormData({...formData, customUpazila: e.target.value})}
                          placeholder={language === 'bn' ? "উপজেলার নাম লিখুন" : "Type Upazila Name"}
                          aria-label={language === 'bn' ? "উপজেলার নাম" : "Type Upazila Name"}
                          className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary/20 text-base font-medium"
                        />
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="checkout-customer-address" className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{language === 'bn' ? "বিস্তারিত ঠিকানা" : "Detailed Address"}</label>
                    <textarea 
                      id="checkout-customer-address"
                      required
                      value={formData.address || ''}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder={language === 'bn' ? "বাসা নম্বর, সড়ক নম্বর..." : "House no, Street no..."}
                      aria-label={language === 'bn' ? "বিস্তারিত ঠিকানা" : "Detailed Address"}
                      className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-primary/20 min-h-[100px] text-base font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div id="checkout-payment-section" className={`p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-sm ${isMixedCart ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <CreditCard size={20} className="text-primary" />
                    {language === 'bn' ? "পেমেন্ট পদ্ধতি" : "Payment Method"}
                  </h3>
                  {!paymentMethod && (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1 rounded-full">
                      {language === 'bn' ? "পদ্ধতি সিলেক্ট করুন" : "Select payment method"}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div 
                    onClick={() => setPaymentMethod("online")}
                    className={`relative flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all cursor-pointer ${
                      paymentMethod === "online" 
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/20" 
                        : "border-neutral-200 dark:border-neutral-800 hover:border-primary/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      paymentMethod === "online" 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                    }`}>
                      <Zap size={24} />
                    </div>
                    <div>
                      <p className="font-bold flex items-center gap-1.5 text-neutral-900 dark:text-white">
                        {language === 'bn' ? "অনলাইন পেমেন্ট" : "Online Payment"}
                        {isUddoktaPayActive && (
                          <span className="text-[9px] bg-primary text-white font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Auto</span>
                        )}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{language === 'bn' ? "বিকাশ, নগদ, রকেট, কার্ড" : "bKash, Nagad, Rocket, Cards"}</p>
                    </div>
                    {paymentMethod === "online" && <CheckCircle2 size={20} className="ml-auto text-primary shrink-0" />}
                  </div>

                  <div 
                    onClick={() => {
                      setPaymentMethod("cod");
                      setOnlineProvider("");
                    }}
                    className={`relative flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all cursor-pointer ${
                      paymentMethod === "cod" 
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/20" 
                        : "border-neutral-200 dark:border-neutral-800 hover:border-primary/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      paymentMethod === "cod" 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                    }`}>
                      <Truck size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-white">{language === 'bn' ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery"}</p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">+৳২০ {language === 'bn' ? "সার্ভিস চার্জ (হাতে পেয়ে মূল্য পরিশোধ)" : "Service Charge"}</p>
                    </div>
                    {paymentMethod === "cod" && <CheckCircle2 size={20} className="ml-auto text-primary shrink-0" />}
                  </div>
                </div>

                {/* Guidance when neither payment method is clicked yet */}
                {!paymentMethod && (
                  <div className="mb-4 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs font-semibold">
                    <AlertCircle size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      {language === 'bn' 
                        ? "👉 অর্ডার করতে অনুগ্রহ করে ওপরের যেকোনো একটি মাধ্যমে (অনলাইন পেমেন্ট অথবা ক্যাশ অন ডেলিভারি) ক্লিক করুন।" 
                        : "👉 Please click either Online Payment or Cash on Delivery above to choose how to pay."}
                    </span>
                  </div>
                )}

                {/* COD selected confirmation badge */}
                {paymentMethod === "cod" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-emerald-900 dark:text-emerald-200 text-xs font-semibold"
                  >
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {language === 'bn' 
                        ? "ক্যাশ অন ডেলিভারি নির্বাচিত হয়েছে। পণ্য ডেলিভারি পেয়ে মূল্য ও ২০ টাকা সার্ভিস চার্জ পরিশোধ করুন।" 
                        : "Cash on Delivery selected. Pay the total amount when your delivery arrives."}
                    </span>
                  </motion.div>
                )}

                <AnimatePresence>
                  {paymentMethod === "online" && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-4"
                    >
                      {/* Gateway vs Manual toggle if manual fallback is enabled */}
                      {isUddoktaPayActive && uddoktaPaySettings?.allowManualFallback && (
                        <div className="flex gap-2 p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
                          <button
                            type="button"
                            onClick={() => setOnlineMode("gateway")}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              onlineMode === "gateway" 
                                ? "bg-white dark:bg-neutral-900 text-primary shadow-sm" 
                                : "text-neutral-500 hover:text-neutral-800"
                            }`}
                          >
                            <Zap size={14} />
                            <span>{language === 'bn' ? "অটোমেটিক গেটওয়ে (Auto Verify)" : "Automated Gateway"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOnlineMode("manual")}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              onlineMode === "manual" 
                                ? "bg-white dark:bg-neutral-900 text-primary shadow-sm" 
                                : "text-neutral-500 hover:text-neutral-800"
                            }`}
                          >
                            <CreditCard size={14} />
                            <span>{language === 'bn' ? "ম্যানুয়াল সেন্ড মানি" : "Manual Send Money"}</span>
                          </button>
                        </div>
                      )}

                      {/* Automated UddoktaPay View */}
                      {isUddoktaPayActive && onlineMode === "gateway" ? (
                        <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent border border-primary/20 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary font-black text-sm">
                              <ShieldCheck size={18} />
                              <span>{language === 'bn' ? "UddoktaPay সুরক্ষিত গেটওয়ে" : "UddoktaPay Secure Gateway"}</span>
                            </div>
                            <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 dark:bg-green-500/10 px-2.5 py-1 rounded-full">
                              {language === 'bn' ? "তাত্ক্ষণিক অটো ভেরিফাই" : "Instant Auto Verify"}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
                            {language === 'bn' 
                              ? "অর্ডার কনফার্ম করার পর আপনাকে UddoktaPay-এর সুরক্ষিত পেমেন্ট পেজে নেওয়া হবে। সেখানে বিকাশ, নগদ, রকেট বা কার্ডের মাধ্যমে পেমেন্ট করলেই সাথে সাথে অর্ডার অটো ভেরিফাই হয়ে যাবে।" 
                              : "After confirming, you will be redirected to the secure UddoktaPay portal. Payment via bKash, Nagad, Rocket or Cards will automatically verify instantly."}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <div className="px-3 py-1.5 rounded-xl bg-[#D12053] text-white text-[11px] font-black tracking-wide shadow-sm">
                              bKash
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-[#F7941D] text-white text-[11px] font-black tracking-wide shadow-sm">
                              Nagad
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-[#8C3494] text-white text-[11px] font-black tracking-wide shadow-sm">
                              Rocket
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-neutral-800 text-white text-[11px] font-black tracking-wide shadow-sm">
                              Visa / Master
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Manual Payment Provider View */
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                            {language === 'bn' ? "পেমেন্ট মাধ্যম সিলেক্ট করুন:" : "Select Payment Method:"}
                          </p>
                          <div className="grid grid-cols-3 gap-4">
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
                        </div>
                      )}
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
                  <div className="flex justify-between text-neutral-500 font-medium">
                    <span>{language === 'bn' ? "পেমেন্ট মাধ্যম" : "Payment Method"}</span>
                    <span className={paymentMethod ? "font-bold text-neutral-800 dark:text-white" : "font-semibold text-amber-600 dark:text-amber-400"}>
                      {paymentMethod === "online" 
                        ? (language === 'bn' ? "অনলাইন পেমেন্ট" : "Online Payment") 
                        : paymentMethod === "cod" 
                          ? (language === 'bn' ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery") 
                          : (language === 'bn' ? "সিলেক্ট করা হয়নি" : "Not Selected")}
                    </span>
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
                  disabled={isMixedCart || isRedirectingPayment}
                  className={`w-full py-5 rounded-[1.5rem] font-black text-lg shadow-lg flex items-center justify-center gap-3 group transition-all ${
                    isMixedCart || isRedirectingPayment
                      ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed shadow-none" 
                      : !paymentMethod 
                        ? "bg-primary/90 text-white shadow-primary/20 hover:scale-[1.02] active:scale-95 ring-2 ring-primary/30"
                        : "bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-95"
                  }`}
                >
                  {isRedirectingPayment ? (
                    <>
                      <Loader2 size={24} className="animate-spin text-primary" />
                      <span>{language === 'bn' ? "পেমেন্ট গেটওয়েতে নেওয়া হচ্ছে..." : "Redirecting to Payment..."}</span>
                    </>
                  ) : isMixedCart ? (
                    <>
                      <Ban size={24} />
                      <span>{language === 'bn' ? "অর্ডার সম্ভব নয়" : "Cannot Order"}</span>
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'online' && isUddoktaPayActive && onlineMode === 'gateway' ? (
                        <>
                          <Zap size={24} className="group-hover:scale-110 transition-transform text-amber-300" />
                          <span>{language === 'bn' ? "পেমেন্ট করুন ও কনফার্ম করুন" : "Pay & Confirm Order"}</span>
                          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform ml-1" />
                        </>
                      ) : paymentMethod === 'cod' ? (
                        <>
                          <Truck size={24} className="group-hover:scale-110 transition-transform text-white" />
                          <span>{language === 'bn' ? "ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করুন" : "Confirm COD Order"}</span>
                        </>
                      ) : !paymentMethod ? (
                        <>
                          <CreditCard size={24} />
                          <span>{language === 'bn' ? "পেমেন্ট পদ্ধতি বেছে নিন" : "Select Payment Method"}</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={24} className="group-hover:rotate-12 transition-transform" />
                          <span>{language === 'bn' ? "অর্ডার কনফার্ম করুন" : "Confirm Order"}</span>
                        </>
                      )}
                    </>
                  )}
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
                    className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-4 focus:ring-primary/10 text-base font-bold placeholder:opacity-30"
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
                    className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none focus:ring-4 focus:ring-primary/10 text-base font-bold placeholder:opacity-30"
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
        {/* Gateway Redirecting Overlay */}
        {isRedirectingPayment && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-7 sm:p-9 max-w-md w-full text-center space-y-5 shadow-2xl border border-neutral-100 dark:border-neutral-800 relative"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck size={36} />
              </div>
              
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {language === 'bn' ? "পেমেন্ট সেশন প্রস্তুত" : "Payment Session Ready"}
                </div>
                <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                  {language === 'bn' ? "অনলাইন পেমেন্ট গেটওয়ে" : "Online Payment Gateway"}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                  {language === 'bn' 
                    ? "নিরাপদ পেমেন্ট গেটওয়েতে প্রবেশ করতে নিচের বাটনে চাপ দিন (bKash, Nagad, Rocket, Cards):" 
                    : "Click below to proceed to the secure payment page (bKash, Nagad, Rocket, Cards):"}
                </p>
              </div>

              {gatewayRedirectUrl ? (
                <div className="space-y-3 pt-2">
                  <a 
                    href={gatewayRedirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-4.5 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/25 hover:bg-primary/95 active:scale-95 transition-all"
                  >
                    <span>{language === 'bn' ? "পেমেন্ট করতে ক্লিক করুন" : "Click to Complete Payment"}</span>
                    <ExternalLink size={18} />
                  </a>

                  {pendingOrderId && (
                    <button
                      type="button"
                      onClick={() => navigate(`/payment-verify/${pendingOrderId}`)}
                      className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                    >
                      <CheckCircle2 size={16} />
                      <span>{language === 'bn' ? "পেমেন্ট সম্পন্ন করেছেন? যাচাই করুন" : "Already Paid? Verify Now"}</span>
                      <ArrowRight size={14} />
                    </button>
                  )}

                  <div className="p-3 bg-amber-500/10 dark:bg-amber-500/5 rounded-xl border border-amber-500/20 text-left">
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                      💡 <strong>পেমেন্ট নির্দেশনা:</strong> গেটওয়েতে অর্থ প্রদানের পর এই পেজ স্বয়ংক্রিয়ভাবে আপডেট হবে। যদি স্বয়ংক্রিয়ভাবে রিডাইরেক্ট না হয়, তবে উপরের <strong>"পেমেন্ট সম্পন্ন করেছেন? যাচাই করুন"</strong> বাটনে চাপ দিন।
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-4 text-neutral-400 text-xs font-bold">
                  <Loader2 size={18} className="animate-spin text-primary" />
                  <span>{language === 'bn' ? "পেমেন্ট লিংক তৈরি হচ্ছে..." : "Generating payment link..."}</span>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsRedirectingPayment(false);
                    navigate('/profile');
                  }}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors"
                >
                  {language === 'bn' ? "আমার অর্ডারসমূহ দেখুন" : "View My Orders"}
                </button>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <button
                  type="button"
                  onClick={async () => {
                    if (pendingOrderId) {
                      try {
                        await updateOrder(pendingOrderId, {
                          paymentMethod: 'Cash on Delivery',
                          paymentStatus: 'unpaid',
                          uddoktaPayStatus: 'switched_to_cod'
                        });
                      } catch (e) {}
                    }
                    setIsRedirectingPayment(false);
                    setGatewayRedirectUrl(null);
                    setPaymentMethod('cod');
                  }}
                  className="text-xs font-bold text-neutral-400 hover:text-rose-500 transition-colors"
                >
                  {language === 'bn' ? "ক্যাশ অন ডেলিভারিতে রূপান্তর / বাতিল" : "Switch to COD / Cancel"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
