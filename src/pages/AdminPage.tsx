import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  LayoutDashboard, ShoppingBag, List, Image as ImageIcon, 
  Settings, MessageSquare, Phone, Plus, Trash2, Edit2, 
  Save, X, ChevronRight, ChevronDown, Package, DollarSign, Users,
  Globe, Mail, MapPin, CreditCard, Camera, Menu, Lock,
  Shirt, ShoppingBasket, ImagePlus, Truck, Printer, Store,
  Eye, EyeOff, Clock, Send, Gift, FileText, Download, Check, Ban, ExternalLink, Copy, Calendar, Youtube, Share2, Instagram, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAdmin, ContactInfo, ShippingSettings, TelegramSettings, Area } from '../context/AdminContext';
import { sendTelegramNotification } from '../utils/telegram';
import { useOrders, Order } from '../context/OrderContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Product, Category, Offer, Subcategory, Slider, SteadfastSettings } from '../types';
import { 
  createSteadfastOrder, 
  getSteadfastBalance, 
  getSteadfastStatusByTrackingCode, 
  formatSteadfastStatus, 
  getSteadfastTrackingUrl 
} from '../utils/steadfast';
import { compressImageFile } from '../utils/imageCompressor';
import PageTransition from "../components/PageTransition";
import { LogOut } from 'lucide-react';

type AdminTab = 'dashboard' | 'products' | 'categories' | 'sub-categories' | 'sliders' | 'orders' | 'appearance' | 'offers' | 'messages' | 'telegram' | 'steadfast' | 'users' | 'social-links';

export default function AdminPage() {
  const navigate = useNavigate();
  const { logout, user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'All' | 'Pending' | 'Completed' | 'Cancelled'>('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    
    const q = query(collection(db, "users"), orderBy("lastLogin", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(users);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "users"));
    return () => unsubscribe();
  }, [isAdmin]);
  
  const { 
    products, categories, sliders, offers, telegramSettings, steadfastSettings, scrollingMessage, contactInfo, shippingSettings,
    setScrollingMessage, setContactInfo, addSlider, removeSlider, updateSlider,
    addProduct, updateProduct, removeProduct, 
    addCategory, updateCategory, removeCategory,
    addOffer, updateOffer, removeOffer,
    setShippingSettings, setTelegramSettings, setSteadfastSettings
  } = useAdmin();
  const { orders, updateOrderStatus, updateOrder } = useOrders();
  const { language } = useSettings();

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingOffer, setEditingOffer] = useState<Partial<Offer> | null>(null);
  const [editingSlider, setEditingSlider] = useState<Partial<Slider> | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{sub: Partial<Subcategory>, parentId: string} | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [localTelegram, setLocalTelegram] = useState<TelegramSettings | null>(null);
  const [localSteadfast, setLocalSteadfast] = useState<SteadfastSettings | null>(null);
  const [localContactInfo, setLocalContactInfo] = useState<ContactInfo | null>(null);
  const [localShippingSettings, setLocalShippingSettings] = useState<ShippingSettings | null>(null);
  const [localScrollingMessage, setLocalScrollingMessage] = useState<string>('');

  const [testingSteadfast, setTestingSteadfast] = useState(false);
  const [steadfastBalance, setSteadfastBalance] = useState<number | null>(null);
  const [showSteadfastApiKey, setShowSteadfastApiKey] = useState(false);
  const [showSteadfastSecretKey, setShowSteadfastSecretKey] = useState(false);

  const [dispatchingOrder, setDispatchingOrder] = useState<Order | null>(null);
  const [dispatchForm, setDispatchForm] = useState({ name: '', phone: '', address: '', codAmount: 0, note: '' });
  const [isDispatching, setIsDispatching] = useState(false);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (telegramSettings && !localTelegram) setLocalTelegram(telegramSettings);
    if (steadfastSettings && !localSteadfast) setLocalSteadfast(steadfastSettings);
    if (contactInfo && !localContactInfo) setLocalContactInfo(contactInfo);
    if (shippingSettings && !localShippingSettings) setLocalShippingSettings(shippingSettings);
    if (scrollingMessage && !localScrollingMessage) setLocalScrollingMessage(scrollingMessage);
  }, [telegramSettings, steadfastSettings, contactInfo, shippingSettings, scrollingMessage]);

  const handleTestSteadfast = async () => {
    if (!localSteadfast?.apiKey || !localSteadfast?.secretKey) {
      showNotification('Steadfast API Key ও Secret Key প্রদান করুন', 'error');
      return;
    }
    setTestingSteadfast(true);
    try {
      const res = await getSteadfastBalance({ apiKey: localSteadfast.apiKey, secretKey: localSteadfast.secretKey });
      if (res.status === 200 && typeof res.current_balance === 'number') {
        setSteadfastBalance(res.current_balance);
        showNotification(`সংযোগ সফল! বর্তমান অ্যাকাউন্ট ব্যালেন্স: ৳${res.current_balance}`, 'success');
      } else if (res.status === 200) {
        showNotification('Steadfast API কানেক্টেড! ✅', 'success');
      } else {
        showNotification(res.message || 'Steadfast কানেকশন ব্যর্থ হয়েছে। কী ও সিক্রেট চেক করুন।', 'error');
      }
    } catch (err: any) {
      showNotification('সংযোগ ব্যর্থ হয়েছে', 'error');
    } finally {
      setTestingSteadfast(false);
    }
  };

  const handleSaveSteadfast = async () => {
    if (localSteadfast) {
      await setSteadfastSettings(localSteadfast);
      showNotification('স্টেডফাস্ট সেটিংস সফলভাবে সেভ করা হয়েছে');
    }
  };

  const openDispatchModal = (order: Order) => {
    const isCod = order.paymentMethod === 'Cash on Delivery';
    setDispatchForm({
      name: order.customerInfo.name || '',
      phone: order.customerInfo.phone || '',
      address: `${order.customerInfo.address || ''}${order.customerInfo.area ? ', ' + order.customerInfo.area : ''}`,
      codAmount: isCod ? order.total : 0,
      note: steadfastSettings?.defaultNote || 'Handle with Care',
    });
    setDispatchingOrder(order);
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchingOrder) return;
    if (!steadfastSettings?.apiKey || !steadfastSettings?.secretKey) {
      showNotification('দয়া করে প্রথমে অ্যাডমিন সেটিংস থেকে Steadfast API Key কনফিগার করুন', 'error');
      return;
    }
    setIsDispatching(true);
    try {
      const invoice = `INV-${dispatchingOrder.id.slice(-6).toUpperCase()}`;
      const res = await createSteadfastOrder({
        invoice,
        recipient_name: dispatchForm.name,
        recipient_phone: dispatchForm.phone,
        recipient_address: dispatchForm.address,
        cod_amount: Number(dispatchForm.codAmount) || 0,
        note: dispatchForm.note,
      }, {
        apiKey: steadfastSettings.apiKey,
        secretKey: steadfastSettings.secretKey,
      });

      if (res.status === 200 && res.consignment) {
        const trackingCode = res.consignment.tracking_code;
        const consignmentId = res.consignment.consignment_id;
        const trackingUrl = getSteadfastTrackingUrl(trackingCode);

        const updatedData: Partial<Order> = {
          steadfastConsignmentId: consignmentId,
          steadfastTrackingCode: trackingCode,
          steadfastStatus: res.consignment.status || 'in_review',
          steadfastBookedAt: new Date().toISOString(),
          steadfastNote: dispatchForm.note,
          trackingLink: trackingUrl,
          status: 'Processing',
        };

        updateOrder(dispatchingOrder.id, updatedData);
        if (selectedOrder && selectedOrder.id === dispatchingOrder.id) {
          setSelectedOrder({ ...selectedOrder, ...updatedData });
        }

        showNotification(`পার্সেল সফলভাবে বুক হয়েছে! ট্র্যাকিং কোড: ${trackingCode}`, 'success');
        setDispatchingOrder(null);
      } else {
        const errMsg = res.message || (res.errors ? Object.values(res.errors).flat().join(', ') : 'বুকিং ব্যর্থ হয়েছে');
        showNotification(errMsg, 'error');
      }
    } catch (err: any) {
      showNotification(err?.message || 'বুকিং এর সময় ত্রুটি হয়েছে', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSyncSteadfastStatus = async (order: Order) => {
    if (!order.steadfastTrackingCode) return;
    if (!steadfastSettings?.apiKey || !steadfastSettings?.secretKey) {
      showNotification('Steadfast ক্রেডেনশিয়াল কনফিগার করা নেই', 'error');
      return;
    }
    setSyncingOrderId(order.id);
    try {
      const res = await getSteadfastStatusByTrackingCode(order.steadfastTrackingCode, {
        apiKey: steadfastSettings.apiKey,
        secretKey: steadfastSettings.secretKey,
      });

      if (res.status === 200 && res.delivery_status) {
        const newStatus = res.delivery_status;
        let orderStatus = order.status;
        if (newStatus === 'delivered') orderStatus = 'Completed';
        if (newStatus === 'cancelled') orderStatus = 'Cancelled';

        const updatedData: Partial<Order> = {
          steadfastStatus: newStatus,
          status: orderStatus,
        };

        updateOrder(order.id, updatedData);
        if (selectedOrder && selectedOrder.id === order.id) {
          setSelectedOrder({ ...selectedOrder, ...updatedData });
        }
        showNotification(`স্ট্যাটাস আপডেট হয়েছে: ${newStatus}`, 'success');
      } else {
        showNotification(res.message || 'স্ট্যাটাস চেক করা সম্ভব হয়নি', 'error');
      }
    } catch (err: any) {
      showNotification('স্ট্যাটাস সিঙ্ক ব্যর্থ হয়েছে', 'error');
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handleTestTelegram = async () => {
    if (!localTelegram?.botToken || !localTelegram?.chatId) {
      showNotification('Bot Token and Chat ID are required for testing', 'error');
      return;
    }
    showNotification('Testing connection...');
    try {
      const result = await sendTelegramNotification(
        localTelegram.botToken, 
        localTelegram.chatId, 
        '🔔 <b>Test Notification</b>\nYour Telegram integration is working correctly! ✅'
      );
      
      if (result.success) {
        if (result.migratedTo) {
          setLocalTelegram(prev => prev ? {...prev, chatId: result.migratedTo.toString()} : null);
          showNotification('Telegram upgraded your group! New Chat ID applied. Please save settings.', 'success');
        } else {
          showNotification('Test message sent! Check your Telegram.');
        }
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (err) {
      showNotification('Failed to send test message.', 'error');
    }
  };

  const handleSaveTelegram = () => {
    if (localTelegram) {
      setTelegramSettings(localTelegram);
      showNotification('Telegram settings saved and updated!');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveSettings = () => {
    if (localContactInfo) setContactInfo(localContactInfo);
    if (localShippingSettings) setShippingSettings(localShippingSettings);
    showNotification('সব সেটিংস সফলভাবে সেভ করা হয়েছে');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, {
          maxWidth: 1000,
          maxHeight: 1000,
          quality: 0.75,
          maxSizeBytes: 150 * 1024
        });
        callback(compressed);
      } catch (err) {
        console.error('Image compression failed', err);
        showNotification('ইমেজ প্রসেস করা সম্ভব হয়নি', 'error');
      }
    }
  };

   const downloadInvoice = async () => {
     if (!invoiceRef.current || !selectedOrder) return;
     
     setIsDownloading(true);
     showNotification('ইনভয়েস প্রিপেয়ার হচ্ছে...');
     
     try {
        const element = invoiceRef.current;
        
        // Use a 100ms timeout to ensure UI state for "downloading" is rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(element, {
           scale: 2,
           useCORS: true,
           logging: false,
           backgroundColor: '#ffffff',
           onclone: (clonedDoc) => {
              // CRITICAL: html2canvas 1.4.1 doesn't support modern CSS color functions (oklch, oklab, color-mix).
              // We must sanitize all <style> tags and inline styles to prevent the parser from crashing.
              
              // 1. Sanitize all <style> tags with a robust regex that handles nested parentheses
              const modernColorRegex = /(oklch|oklab|color-mix)\s*\((?:[^()]+|\([^()]*\))*\)/g;
              
              Array.from(clonedDoc.querySelectorAll('style')).forEach(styleTag => {
                if (styleTag.textContent && (styleTag.textContent.includes('oklch') || styleTag.textContent.includes('oklab') || styleTag.textContent.includes('color-mix'))) {
                  styleTag.textContent = styleTag.textContent.replace(modernColorRegex, '#000000');
                }
              });

              // 2. Sanitize the target element and its children
              const el = clonedDoc.querySelector('.print-invoice') as HTMLElement;
              if (el) {
                 el.style.maxHeight = 'none';
                 el.style.overflow = 'visible';
                 el.style.borderRadius = '0';
                 el.style.boxShadow = 'none';
                 el.style.backgroundColor = '#ffffff';
                 el.style.color = '#000000';
                 
                 // Deep sanitize all elements for any inline styles or remaining modern colors
                 const allElements = el.querySelectorAll('*');
                 allElements.forEach(item => {
                    const node = item as HTMLElement;
                    
                    // Check inline style attribute directly
                    const inlineStyle = node.getAttribute('style') || '';
                    if (inlineStyle.includes('oklch') || inlineStyle.includes('oklab') || inlineStyle.includes('color-mix')) {
                        node.setAttribute('style', inlineStyle.replace(modernColorRegex, '#000000'));
                    }
                    
                    // Also explicitly override common properties if they still seem to have issues
                    // (useful if they were set via CSS variables that the regex might have missed)
                    try {
                      const computed = window.getComputedStyle(node);
                      if (computed.color.includes('oklch') || computed.color.includes('oklab')) node.style.color = '#000000';
                      if (computed.backgroundColor.includes('oklch') || computed.backgroundColor.includes('oklab')) node.style.backgroundColor = 'transparent';
                      if (computed.borderColor.includes('oklch') || computed.borderColor.includes('oklab')) node.style.borderColor = '#eeeeee';
                    } catch (e) {
                      // ignore computed style errors
                    }
                 });
              }
              const noPrint = clonedDoc.querySelectorAll('.no-print');
              noPrint.forEach(item => (item as HTMLElement).style.display = 'none');
           }
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new (jsPDF as any)('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Invoice-${selectedOrder.id}.pdf`);
        showNotification('ইনভয়েস ডাউনলোড সফল হয়েছে');
     } catch (error) {
        console.error('PDF Generation Error:', error);
        showNotification('ডাউনলোড ব্যর্থ হয়েছে। স্ক্রিনশট নিন অথবা প্রিন্ট অপশন ব্যবহার করুন।', 'error');
     } finally {
        setIsDownloading(false);
     }
  };

  const renderDashboard = () => {
    const totalStockValue = products.reduce((acc, curr) => acc + (Number(curr.price) * Number(curr.stock || 0)), 0);

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'মোট প্রডাক্ট', value: products.length, icon: <ShoppingBag />, color: 'primary' },
            { label: 'মোট অর্ডার', value: orders.length, icon: <Package />, color: 'blue' },
            { label: 'ইউজার', value: usersList.length, icon: <Users />, color: 'green' },
            { label: 'স্টক ভ্যালু', value: `৳${totalStockValue}`, icon: <DollarSign />, color: 'amber' },
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={stat.label} 
              className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-sm"
            >
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
                {stat.icon}
              </div>
              <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white">{stat.value}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderSliders = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">{language === 'bn' ? "স্লাইডার ম্যানেজমেন্ট" : "Sliders"}</h2>
        <button 
          onClick={() => setEditingSlider({})}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
        >
          <Plus size={20} /> নতুন স্লাইডার
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sliders.map(slider => (
          <div key={slider.id} className="group relative bg-white dark:bg-neutral-900 rounded-[2rem] overflow-hidden border border-neutral-100 dark:border-neutral-800">
            <img src={slider.image} className="w-full aspect-[21/9] object-cover" alt="" />
            <div className="p-6">
              <h4 className="font-black mb-1">{slider.title || 'No Title'}</h4>
              <p className="text-xs text-neutral-400 font-bold truncate">{slider.link || 'No Link'}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setEditingSlider(slider)} className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl font-bold text-blue-500 flex items-center justify-center gap-2">
                  <Edit2 size={14}/> Edit
                </button>
                <button onClick={async () => {
                  try {
                    await removeSlider(slider.id);
                    showNotification('স্লাইডার রিমুভ করা হয়েছে');
                  } catch (err) {
                    showNotification('স্লাইডার ডিলিট করতে সমস্যা হয়েছে', 'error');
                  }
                }} className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl font-bold text-red-500 flex items-center justify-center gap-2">
                  <Trash2 size={14}/> Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOrders = () => {
    const filteredOrders = orders.filter(o => {
      if (orderFilter === 'All') return true;
      return o.status === orderFilter;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-black">{language === 'bn' ? "অর্ডার ম্যানেজমেন্ট" : "Orders"}</h2>
          <div className="flex bg-white dark:bg-neutral-900 p-1 rounded-xl border border-neutral-100 dark:border-neutral-800 w-full sm:w-auto overflow-x-auto">
             {(['All', 'Pending', 'Completed', 'Cancelled'] as const).map(f => (
               <button 
                 key={f}
                 onClick={() => setOrderFilter(f)}
                 className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${orderFilter === f ? 'bg-primary text-white' : 'text-neutral-400'}`}
               >
                 {f}
               </button>
             ))}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Order Info</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Total</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredOrders.length > 0 ? filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-black text-sm">#{order.id.slice(-6)}</div>
                      <div className="text-[10px] text-neutral-400 font-bold">{order.date}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-sm">{order.customerInfo.name}</div>
                      <div className="text-[10px] text-neutral-400 font-bold">{order.customerInfo.phone}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-primary">৳{order.total}</div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <div className="text-[10px] text-neutral-400 font-bold truncate max-w-[80px]">{order.paymentMethod}</div>
                        {order.lastNumber && (
                           <div className="bg-primary/10 text-primary text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter" title="Last Number">
                             {order.lastNumber}
                           </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1.5">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'Completed' ? 'bg-green-50 text-green-600' :
                          order.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {order.status}
                        </span>
                        {order.steadfastTrackingCode && (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                            <Truck size={10} />
                            <span className="font-mono">{order.steadfastTrackingCode}</span>
                            <span className="text-[8px] uppercase px-1 bg-amber-500/20 rounded">
                              {order.steadfastStatus ? formatSteadfastStatus(order.steadfastStatus) : 'Booked'}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => setSelectedOrder(order)} 
                           title="বিস্তারিত দেখুন (View Details)"
                           className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-primary hover:bg-primary hover:text-white transition-all"
                         >
                           <Eye size={14}/>
                         </button>

                         {/* Steadfast Dispatch or Sync Button */}
                         {order.steadfastTrackingCode ? (
                           <button
                             onClick={() => handleSyncSteadfastStatus(order)}
                             disabled={syncingOrderId === order.id}
                             title="Steadfast লাইভ স্ট্যাটাস আপডেট (Sync Status)"
                             className="p-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
                           >
                             <RefreshCw size={14} className={syncingOrderId === order.id ? 'animate-spin' : ''} />
                           </button>
                         ) : (
                           <button
                             onClick={() => openDispatchModal(order)}
                             title="Steadfast এ বুক করুন (Send to Steadfast)"
                             className="p-2 bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-all shadow-sm"
                           >
                             <Truck size={14} />
                           </button>
                         )}

                         <button 
                           onClick={() => {
                             const statuses = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'] as const;
                             const nextIndex = (statuses.indexOf(order.status as any) + 1) % statuses.length;
                             updateOrderStatus(order.id, statuses[nextIndex]);
                           }} 
                           title="স্ট্যাটাস পরিবর্তন করুন (Cycle Status)"
                           className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                         >
                           <Check size={14}/>
                         </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-neutral-400 font-bold">কোন অর্ডার পাওয়া যায়নি</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderOffers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">Offer Management</h2>
        <button 
          onClick={() => setEditingOffer({ status: 'active' })}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
        >
          <Plus size={20} /> Add Offer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map(offer => (
          <div key={offer.id} className="bg-white dark:bg-neutral-900 rounded-[2rem] overflow-hidden border border-neutral-100 dark:border-neutral-800 relative">
             <div className="absolute top-4 right-4 z-10">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${offer.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-400'}`}>
                  {offer.status}
                </span>
             </div>
             <img src={offer.image} className="w-full aspect-video object-cover" alt="" />
             <div className="p-6">
                {offer.badge && <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-lg mb-2 inline-block">{offer.badge}</span>}
                <h4 className="font-black text-lg mb-1">{offer.title}</h4>
                <p className="text-sm text-neutral-500 font-bold mb-4">{offer.description}</p>
                <div className="flex gap-2">
                   <button onClick={() => setEditingOffer(offer)} className="flex-1 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl font-bold text-xs"><Edit2 size={12} className="inline mr-1"/> Edit</button>
                   <button onClick={async () => {
                     try {
                       await removeOffer(offer.id);
                       showNotification('অফার রিমুভ করা হয়েছে');
                     } catch (err) {
                       showNotification('অফার ডিলিট করতে সমস্যা হয়েছে', 'error');
                     }
                   }} className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-bold text-xs"><Trash2 size={12} className="inline mr-1"/> Remove</button>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSocialLinks = () => (
    <div className="max-w-2xl space-y-8">
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-sm space-y-8">
         <div className="flex items-center justify-between">
            <h3 className="text-xl font-black flex items-center gap-2">
               <Share2 className="text-primary" /> Social Media Links
            </h3>
         </div>

         <div className="space-y-6">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                  <Youtube size={14} className="text-red-600" /> YouTube Channel Link
               </label>
               <div className="relative group">
                  <input 
                    type="text" 
                    value={contactInfo.youtubeLink || ''}
                    onChange={e => setContactInfo({...contactInfo, youtubeLink: e.target.value})}
                    className="w-full pl-6 pr-12 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
                    placeholder="https://youtube.com/@channel"
                  />
                  {contactInfo.youtubeLink && (
                    <button 
                      onClick={() => setContactInfo({...contactInfo, youtubeLink: ''})}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                  <Instagram size={14} className="text-pink-600" /> Instagram Profile Link
               </label>
               <div className="relative group">
                  <input 
                    type="text" 
                    value={contactInfo.supportLink || ''}
                    onChange={e => setContactInfo({...contactInfo, supportLink: e.target.value})}
                    className="w-full pl-6 pr-12 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
                    placeholder="https://instagram.com/user"
                  />
                  {contactInfo.supportLink && (
                    <button 
                      onClick={() => setContactInfo({...contactInfo, supportLink: ''})}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                  <Share2 size={14} className="text-neutral-900 dark:text-white" /> TikTok Profile Link
               </label>
               <div className="relative group">
                  <input 
                    type="text" 
                    value={contactInfo.tiktokLink || ''}
                    onChange={e => setContactInfo({...contactInfo, tiktokLink: e.target.value})}
                    className="w-full pl-6 pr-12 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
                    placeholder="https://tiktok.com/@user"
                  />
                  {contactInfo.tiktokLink && (
                    <button 
                      onClick={() => setContactInfo({...contactInfo, tiktokLink: ''})}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
               </div>
            </div>
         </div>

         <div className="p-6 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <p className="text-xs font-bold text-amber-600 leading-relaxed italic">
              * এখানে দেওয়া লিঙ্কগুলো সরাসরি ফুটার (Footer) এবং কন্টাক্ট সেকশনে আপডেট হয়ে যাবে।
            </p>
         </div>

         <button 
           onClick={() => {
             setContactInfo(contactInfo);
             showNotification('সোশ্যাল লিঙ্ক সেভ হয়েছে!');
           }}
           className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
         >
           <Save size={20} /> সোশ্যাল লিঙ্ক সেভ করুন
         </button>
      </div>
    </div>
  );

  const handleSaveScrollingMessage = () => {
    setScrollingMessage(localScrollingMessage);
    showNotification('স্ক্রলিং মেসেজ সফলভাবে সেভ করা হয়েছে');
  };

  const renderMessages = () => (
    <div className="max-w-2xl space-y-8">
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-sm space-y-6">
         <h3 className="text-xl font-black flex items-center gap-2">
            <MessageSquare className="text-primary" /> Scrolling Notice
         </h3>
         <textarea 
           value={localScrollingMessage}
           onChange={(e) => setLocalScrollingMessage(e.target.value)}
           className="w-full p-6 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border-none font-bold text-lg min-h-[150px]"
           placeholder="নোটিশ লিখুন..."
         />
         <button 
           onClick={handleSaveScrollingMessage}
           className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
         >
           <Save size={20} /> আপডেট করুন
         </button>
      </div>
    </div>
  );

  const renderTelegram = () => (
    <div className="max-w-2xl space-y-8">
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-sm space-y-8">
         <div className="flex items-center justify-between">
            <h3 className="text-xl font-black flex items-center gap-2">
               <Send className="text-primary" /> Telegram Integration
            </h3>
            <button 
              onClick={() => setLocalTelegram(prev => prev ? {...prev, isEnabled: !prev.isEnabled} : null)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${localTelegram?.isEnabled ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-400'}`}
            >
              {localTelegram?.isEnabled ? 'Active' : 'Disabled'}
            </button>
         </div>

         <div className="space-y-4">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Bot Token</label>
               <input 
                 type="text" 
                 value={localTelegram?.botToken || ''}
                 onChange={e => setLocalTelegram(prev => prev ? {...prev, botToken: e.target.value} : null)}
                 className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
                 placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Chat ID</label>
               <input 
                 type="text" 
                 value={localTelegram?.chatId || ''}
                 onChange={e => setLocalTelegram(prev => prev ? {...prev, chatId: e.target.value} : null)}
                 className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
                 placeholder="-100123456789"
               />
               <p className="px-2 text-[10px] text-neutral-400 font-medium">Tip: Use @userinfobot or @getmyid_bot to find your Chat ID.</p>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleTestTelegram}
              className="py-4 border-2 border-neutral-100 dark:border-neutral-800 rounded-2xl font-black text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Test Connection
            </button>
            <button 
              onClick={handleSaveTelegram}
              className="py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20"
            >
              Save Settings
            </button>
         </div>

         <div className="p-6 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <p className="text-xs font-bold text-blue-600 leading-relaxed italic">
              * কানেক্ট করলে প্রতিটি নতুন অডারের সাথে সাথে আপনার টেলিগ্রাম বটের মাধ্যমে নোটিফিকেশন পাবেন। বট চালু করতে অন্তত একবার আপনার বটের সাথে কথা (Send /start) বলতে হবে।
            </p>
         </div>
      </div>
    </div>
  );

  const renderSteadfast = () => (
    <div className="max-w-3xl space-y-8">
      {/* Top Banner / Merchant Status */}
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black flex items-center gap-2">
                Steadfast Courier API
              </h3>
              <p className="text-xs text-neutral-400 font-bold">স্টেডফাস্ট কুরিয়ার অটোমেশন ও লাইভ ট্র্যাকিং</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
              localSteadfast?.isEnabled ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800'
            }`}>
              {localSteadfast?.isEnabled ? 'Active' : 'Disabled'}
            </span>
            <a 
              href="https://portal.steadfast.com.bd" 
              target="_blank" 
              rel="noreferrer" 
              className="p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-primary rounded-xl transition-colors"
              title="Steadfast Merchant Portal"
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* Live Balance Card */}
        <div className="p-6 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-3xl border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">মার্চেন্ট অ্যাকাউন্ট ব্যালেন্স</p>
            <div className="text-3xl font-black text-neutral-900 dark:text-white">
              {steadfastBalance !== null ? `৳${steadfastBalance.toLocaleString()}` : '••••'}
            </div>
            <p className="text-[10px] text-neutral-400 font-medium">Steadfast Wallet Balance</p>
          </div>
          <button 
            onClick={handleTestSteadfast}
            disabled={testingSteadfast}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {testingSteadfast ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Truck size={14} />
            )}
            <span>ব্যালেন্স চেক / কানেকশন টেস্ট</span>
          </button>
        </div>
      </div>

      {/* API Configuration Card */}
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-sm space-y-6">
        <h4 className="text-lg font-black flex items-center gap-2">
          <Settings size={18} className="text-primary" /> API ক্রেডেনশিয়াল সেটিংস
        </h4>

        <div className="space-y-5">
          {/* Enable Integration Switch */}
          <div className="flex items-center justify-between p-5 bg-neutral-50 dark:bg-neutral-800 rounded-2xl">
            <div>
              <p className="font-bold text-sm text-neutral-900 dark:text-white">স্টেডফাস্ট কুরিয়ার চালু করুন</p>
              <p className="text-[10px] text-neutral-400 font-medium">Enable Steadfast Integration</p>
            </div>
            <button 
              onClick={() => setLocalSteadfast(prev => prev ? { ...prev, isEnabled: !prev.isEnabled } : null)}
              className={`w-12 h-7 rounded-full transition-all relative ${localSteadfast?.isEnabled ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-700'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${localSteadfast?.isEnabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {/* Auto Booking Switch */}
          <div className="flex items-center justify-between p-5 bg-neutral-50 dark:bg-neutral-800 rounded-2xl">
            <div>
              <p className="font-bold text-sm text-neutral-900 dark:text-white">অর্ডার প্লেস হলে অটো-বুকিং (Auto Dispatch)</p>
              <p className="text-[10px] text-neutral-400 font-medium">কাস্টমার অর্ডার করার সাথে সাথে স্বয়ংক্রিয়ভাবে Steadfast এ পার্সেল বুক হবে</p>
            </div>
            <button 
              onClick={() => setLocalSteadfast(prev => prev ? { ...prev, autoBooking: !prev.autoBooking } : null)}
              className={`w-12 h-7 rounded-full transition-all relative ${localSteadfast?.autoBooking ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-700'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${localSteadfast?.autoBooking ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              API Key (মার্চেন্ট এপিআই কি)
            </label>
            <div className="relative">
              <input 
                type={showSteadfastApiKey ? 'text' : 'password'}
                value={localSteadfast?.apiKey || ''}
                onChange={e => setLocalSteadfast(prev => prev ? { ...prev, apiKey: e.target.value } : null)}
                placeholder="এখানে Steadfast API Key পেস্ট করুন"
                className="w-full px-6 pr-14 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-mono font-bold text-sm"
              />
              <button 
                type="button"
                onClick={() => setShowSteadfastApiKey(!showSteadfastApiKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-neutral-600 rounded-lg"
              >
                {showSteadfastApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              Secret Key (মার্চেন্ট সিক্রেট কি)
            </label>
            <div className="relative">
              <input 
                type={showSteadfastSecretKey ? 'text' : 'password'}
                value={localSteadfast?.secretKey || ''}
                onChange={e => setLocalSteadfast(prev => prev ? { ...prev, secretKey: e.target.value } : null)}
                placeholder="এখানে Steadfast Secret Key পেস্ট করুন"
                className="w-full px-6 pr-14 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-mono font-bold text-sm"
              />
              <button 
                type="button"
                onClick={() => setShowSteadfastSecretKey(!showSteadfastSecretKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-neutral-600 rounded-lg"
              >
                {showSteadfastSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Default Delivery Note */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              ডিফল্ট পার্সেল ডেলিভারি নোট (Default Courier Note)
            </label>
            <input 
              type="text"
              value={localSteadfast?.defaultNote || ''}
              onChange={e => setLocalSteadfast(prev => prev ? { ...prev, defaultNote: e.target.value } : null)}
              placeholder="সাবধান ভঙ্গুর / Handle with Care"
              className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold text-sm"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <button 
            onClick={handleTestSteadfast}
            disabled={testingSteadfast}
            className="py-4 border-2 border-neutral-100 dark:border-neutral-800 rounded-2xl font-black text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
          >
            <Check size={16} /> টেস্ট কানেকশন
          </button>
          <button 
            onClick={handleSaveSteadfast}
            className="py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <Save size={16} /> সেটিংস সেভ করুন
          </button>
        </div>
      </div>

      {/* Guide Card */}
      <div className="p-8 bg-neutral-50 dark:bg-neutral-900/60 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 space-y-4">
        <h4 className="font-black text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          📖 কিভাবে Steadfast API Key পাবেন?
        </h4>
        <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
          <div className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-[10px]">১</span>
            <p>প্রথমে <a href="https://portal.steadfast.com.bd" target="_blank" rel="noreferrer" className="text-primary font-bold underline">Steadfast Merchant Portal</a> এ লগইন করুন।</p>
          </div>
          <div className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-[10px]">২</span>
            <p>সাইডবার মেনু থেকে <b>API Settings</b> অথবা <b>Settings</b> অপশনে যান।</p>
          </div>
          <div className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-[10px]">৩</span>
            <p>সেখান থেকে আপনার <b>API Key</b> এবং <b>Secret Key</b> কপি করে উপরের বক্সে বসিয়ে <b>"সেটিংস সেভ করুন"</b> বাটনে ক্লিক করুন।</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-black">{language === 'bn' ? "ক্যাটাগরি ম্যানেজমেন্ট" : "Categories"}</h2>
        <button 
          onClick={() => setEditingCategory({})}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={20} /> নতুন ক্যাটাগরি
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(categories).map((cat: Category) => (
          <div key={cat.id} className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 space-y-4">
            <div className="flex gap-4">
              <img src={cat.image} className="w-20 h-20 object-cover rounded-2xl" alt={cat.name} />
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-lg">{cat.name}</h4>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingCategory(cat)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl"><Edit2 size={16}/></button>
                    <button onClick={async () => {
                      try {
                        await removeCategory(cat.id);
                        showNotification('ক্যাটাগরি ডিলিট করা হয়েছে');
                      } catch (err) {
                        showNotification('ক্যাটাগরি ডিলিট করতে সমস্যা হয়েছে', 'error');
                      }
                    }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"><Trash2 size={16}/></button>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 font-bold mt-1">{cat.subcategories?.length || 0} Sub-categories</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingCategory && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] max-w-lg w-full space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black">{editingCategory.id ? 'ক্যাটাগরি ইডিট' : 'নতুন ক্যাটাগরি'}</h3>
                <button onClick={() => setEditingCategory(null)} className="p-2 hover:bg-neutral-100 rounded-xl"><X size={20}/></button>
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Category Name</label>
                  <input 
                    type="text" 
                    value={editingCategory.name || ''} 
                    onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Image</label>
                  <div className="flex gap-4">
                    {editingCategory.image && (
                      <img src={editingCategory.image} className="w-16 h-16 object-cover rounded-xl" alt="" />
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="w-full h-16 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-center gap-2 text-neutral-400 font-bold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                        <Camera size={16} /> ফটো সিলেক্ট করুন
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => handleImageUpload(e, (url) => setEditingCategory({...editingCategory, image: url}))}
                      />
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['active', 'hidden', 'pending'].map(s => (
                      <button 
                        key={s}
                        onClick={() => setEditingCategory({...editingCategory, status: s as any})}
                        className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest ${editingCategory.status === s ? 'bg-primary text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Subcategories</label>
                    <button 
                      onClick={() => {
                        const name = prompt('Subcategory name:');
                        if (name) {
                          const subs = [...(editingCategory.subcategories || [])];
                          subs.push({ id: `sub-${Date.now()}`, name, count: 0 });
                          setEditingCategory({...editingCategory, subcategories: subs});
                        }
                      }}
                      className="px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(editingCategory.subcategories || []).map((sub: any, idx: number) => (
                      <div key={sub.id || idx} className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-xs font-bold flex items-center gap-2">
                        {sub.name}
                        <button 
                          onClick={() => {
                            const subs = (editingCategory.subcategories || []).filter((_: any, i: number) => i !== idx);
                            setEditingCategory({...editingCategory, subcategories: subs});
                          }}
                          className="text-red-500"
                        >
                          <X size={10}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={async () => {
                  try {
                    if (!editingCategory.name) return showNotification('ক্যাটাগরির নাম দিন', 'error');
                    if (editingCategory.id) {
                      await updateCategory(editingCategory.id, editingCategory);
                    } else {
                      await addCategory({
                        ...editingCategory,
                        id: editingCategory.name?.toLowerCase().replace(/\s+/g, '-') || `cat-${Date.now()}`,
                        count: 0
                      } as Category);
                    }
                    setEditingCategory(null);
                    showNotification('ক্যাটাগরি সেভ করা হয়েছে');
                  } catch (err) {
                    showNotification('ক্যাটাগরি সেভ করতে সমস্যা হয়েছে', 'error');
                  }
                }}
                className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-lg"
              >
                সেভ করুন
              </button>
           </motion.div>
        </div>
      )}
    </div>
  );

  const renderSubcategories = () => {
    const allSubcategories: {sub: Subcategory, parentId: string, parentName: string}[] = [];
    (Object.values(categories) as Category[]).forEach(cat => {
      if (cat.subcategories) {
        cat.subcategories.forEach(sub => {
          allSubcategories.push({ sub, parentId: cat.id, parentName: cat.name });
        });
      }
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-black">{language === 'bn' ? "সাব-ক্যাটাগরি ম্যানেজমেন্ট" : "Subcategories"}</h2>
          <button 
            onClick={() => setEditingSubcategory({ sub: {}, parentId: '' })}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus size={20} /> নতুন সাব-ক্যাটাগরি
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allSubcategories.map(({ sub, parentId, parentName }) => (
            <div key={`${parentId}-${sub.id || sub.name}`} className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 space-y-4">
              <div className="flex gap-4">
                <img src={sub.image || 'https://placehold.co/100'} className="w-20 h-20 object-cover rounded-2xl bg-neutral-100" alt="" />
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-lg">{sub.name}</h4>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">Main: {parentName}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingSubcategory({ sub, parentId })} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl"><Edit2 size={16}/></button>
                      <button onClick={() => {
                        const newSubs = (categories[parentId].subcategories || []).filter(s => s.id !== sub.id);
                        updateCategory(parentId, { subcategories: newSubs });
                        showNotification('সাব-ক্যাটাগরি রিমুভ করা হয়েছে');
                      }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"><Trash2 size={16}/></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {editingSubcategory && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] max-w-lg w-full space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black">{editingSubcategory.sub.id ? 'সাব-ক্যাটাগরি ইডিট' : 'নতুন সাব-ক্যাটাগরি'}</h3>
                  <button onClick={() => setEditingSubcategory(null)} className="p-2 hover:bg-neutral-100 rounded-xl"><X size={20}/></button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Main Category</label>
                    <select 
                      value={editingSubcategory.parentId}
                      onChange={e => setEditingSubcategory({...editingSubcategory, parentId: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
                    >
                      <option value="">Select Main Category</option>
                      {Object.values(categories).map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Subcategory Name</label>
                    <input 
                      type="text" 
                      value={editingSubcategory.sub.name || ''} 
                      onChange={e => setEditingSubcategory({...editingSubcategory, sub: {...editingSubcategory.sub, name: e.target.value}})}
                      className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Image</label>
                    <div className="flex gap-4">
                      {editingSubcategory.sub.image && (
                        <img src={editingSubcategory.sub.image} className="w-16 h-16 object-cover rounded-xl" alt="" />
                      )}
                      <label className="flex-1 cursor-pointer">
                        <div className="w-full h-16 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-center gap-2 text-neutral-400 font-bold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                          <Camera size={16} /> গ্যালারি থেকে ছবি নিন
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={e => handleImageUpload(e, (url) => setEditingSubcategory({...editingSubcategory, sub: {...editingSubcategory.sub, image: url}}))}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={async () => {
                    try {
                      if (!editingSubcategory.parentId) return showNotification('মেইন ক্যাটাগরি সিলেক্ট করুন', 'error');
                      if (!editingSubcategory.sub.name) return showNotification('নাম দিন', 'error');

                      const parentId = editingSubcategory.parentId;
                      const cat = categories[parentId];
                      const currentSubs = [...(cat.subcategories || [])];

                      if (editingSubcategory.sub.id) {
                        // Update
                        const idx = currentSubs.findIndex(s => s.id === editingSubcategory.sub.id);
                        if (idx !== -1) {
                          currentSubs[idx] = editingSubcategory.sub as Subcategory;
                        }
                      } else {
                        // Add
                        currentSubs.push({
                          ...editingSubcategory.sub,
                          id: `sub-${Date.now()}`
                        } as Subcategory);
                      }

                      await updateCategory(parentId, { subcategories: currentSubs });
                      setEditingSubcategory(null);
                      showNotification('সাব-ক্যাটাগরি সেভ করা হয়েছে');
                    } catch (err) {
                      showNotification('সাব-ক্যাটাগরি সেভ করতে সমস্যা হয়েছে', 'error');
                    }
                  }}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-lg"
                >
                  সেভ করুন
                </button>
             </motion.div>
          </div>
        )}
      </div>
    );
  };

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-black">{language === 'bn' ? "প্রডাক্ট ম্যানেজমেন্ট" : "Products"}</h2>
        <button 
          onClick={() => { setEditingProduct({}); setIsProductModalOpen(true); }}
          className="bg-primary text-white p-3 md:px-6 md:py-3 rounded-2xl font-bold flex items-center gap-2"
        >
          <Plus size={20} /> <span className="hidden md:inline">নতুন যোগ করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white dark:bg-neutral-900 p-4 rounded-[2rem] border border-neutral-100 dark:border-neutral-800">
            <img src={p.image} className="w-full aspect-square object-cover rounded-2xl mb-4" alt="" />
            <div className="flex flex-wrap gap-1 mb-2">
              <span className="text-[8px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-black text-neutral-500 uppercase tracking-tighter">
                {categories[p.category]?.name || p.category}
              </span>
              {p.subCategory && (
                <span className="text-[8px] px-1.5 py-0.5 bg-primary/10 rounded font-black text-primary uppercase tracking-tighter">
                  {categories[p.category]?.subcategories?.find(s => s.id === p.subCategory)?.name || p.subCategory}
                </span>
              )}
            </div>
            <h4 className="font-bold mb-2 line-clamp-1">{p.name}</h4>
            <div className="flex justify-between items-center">
              <span className="text-primary font-black">৳{p.price}</span>
              <div className="flex gap-2">
                <button onClick={() => { setEditingProduct(p); setIsProductModalOpen(true); }} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-blue-500"><Edit2 size={14}/></button>
                <button onClick={() => setDeleteConfirmId(p.id)} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-red-500"><Trash2 size={14}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-8">
      <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-sm space-y-8">
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Lock className="text-primary" /> সিকিউরিটি সেটিংস (Security)
          </h3>
          <div className="flex items-center justify-between p-6 bg-neutral-50 dark:bg-neutral-800 rounded-3xl">
            <div>
              <p className="font-black text-neutral-900 dark:text-white uppercase tracking-widest text-xs">App Maintenance Lock</p>
              <p className="text-[10px] font-bold text-neutral-400 uppercase">Lock the entire app for customers</p>
            </div>
            <button 
              onClick={async () => {
                if (localContactInfo) {
                  const newStatus = !localContactInfo.isAppLocked;
                  const newInfo = {...localContactInfo, isAppLocked: newStatus};
                  setLocalContactInfo(newInfo);
                  // Save immediately to Firestore
                  try {
                    await setContactInfo(newInfo);
                    showNotification(newStatus ? 'App locked successfully!' : 'App unlocked successfully!');
                  } catch (err) {
                    showNotification('Error updating lock status', 'error');
                  }
                }
              }}
              className={`w-14 h-8 rounded-full transition-all relative ${localContactInfo?.isAppLocked ? 'bg-red-500' : 'bg-neutral-300'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${localContactInfo?.isAppLocked ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Store className="text-primary" /> শপ সেটিংস (Shop Settings)
          </h3>
          <div className="space-y-3">
            <label className="text-xs font-black text-neutral-400 uppercase tracking-widest">শপ এর নাম (Shop Name)</label>
            <input 
              type="text"
              value={localContactInfo?.name || ''}
              onChange={(e) => localContactInfo && setLocalContactInfo({ ...localContactInfo, name: e.target.value })}
              className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-black text-xl"
              placeholder="Shop Name"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Truck className="text-primary" /> শিপিং এবং ডেলিভারি চার্জ
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-neutral-400 uppercase tracking-widest">Free Delivery Threshold</label>
              <div className="relative">
                <input 
                  type="number"
                  value={localShippingSettings?.freeDeliveryThreshold || 0}
                  onChange={(e) => localShippingSettings && setLocalShippingSettings({ ...localShippingSettings, freeDeliveryThreshold: parseInt(e.target.value) || 0 })}
                  className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-black text-xl"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-neutral-300">BDT</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-neutral-400 uppercase tracking-widest">Inside Dhaka Fee</label>
              <input 
                type="number"
                value={localShippingSettings?.insideDhakaFee || 0}
                onChange={(e) => localShippingSettings && setLocalShippingSettings({ ...localShippingSettings, insideDhakaFee: parseInt(e.target.value) || 0 })}
                className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-black text-xl"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-neutral-400 uppercase tracking-widest">Outside Dhaka Fee</label>
              <input 
                type="number"
                value={localShippingSettings?.outsideDhakaFee || 0}
                onChange={(e) => localShippingSettings && setLocalShippingSettings({ ...localShippingSettings, outsideDhakaFee: parseInt(e.target.value) || 0 })}
                className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-black text-xl"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-neutral-400 uppercase tracking-widest">Default Fee (Fallback)</label>
              <input 
                type="number"
                value={localShippingSettings?.defaultFee || 0}
                onChange={(e) => localShippingSettings && setLocalShippingSettings({ ...localShippingSettings, defaultFee: parseInt(e.target.value) || 0 })}
                className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-black text-xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 shadow-sm space-y-8">
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Phone className="text-primary" /> কন্টাক্ট এবং পেমেন্ট নম্বর
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Store size={14}/> Shop Name
              </label>
              <input 
                type="text"
                value={localContactInfo?.name || ''}
                onChange={(e) => localContactInfo && setLocalContactInfo({...localContactInfo, name: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Phone size={14}/> Phone
              </label>
              <input 
                type="text"
                value={localContactInfo?.phone || ''}
                onChange={(e) => localContactInfo && setLocalContactInfo({...localContactInfo, phone: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Mail size={14}/> Email
              </label>
              <input 
                type="email"
                value={localContactInfo?.email || ''}
                onChange={(e) => localContactInfo && setLocalContactInfo({...localContactInfo, email: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Send size={14}/> Telegram Link
              </label>
              <input 
                type="text"
                placeholder="https://t.me/yourchannel"
                value={localContactInfo?.telegramLink || ''}
                onChange={(e) => localContactInfo && setLocalContactInfo({...localContactInfo, telegramLink: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={14}/> WhatsApp Number
              </label>
              <input 
                type="text"
                placeholder="01XXXXXXXXX"
                value={localContactInfo?.whatsappNumber || ''}
                onChange={(e) => localContactInfo && setLocalContactInfo({...localContactInfo, whatsappNumber: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14}/> Shop Address
              </label>
              <input 
                type="text"
                value={localContactInfo?.address || ''}
                onChange={(e) => localContactInfo && setLocalContactInfo({...localContactInfo, address: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={14}/> bKash (Personal)
              </label>
              <input 
                type="text"
                value={localContactInfo?.paymentBkash || ''}
                onChange={(e) => localContactInfo && setLocalContactInfo({...localContactInfo, paymentBkash: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={14}/> Nagad (Personal)
              </label>
              <input 
                type="text"
                value={localContactInfo?.paymentNagad || ''}
                onChange={(e) => localContactInfo && setLocalContactInfo({...localContactInfo, paymentNagad: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={14}/> Rocket (Personal)
              </label>
              <input 
                type="text"
                value={localContactInfo?.paymentRocket || ''}
                onChange={(e) => localContactInfo && setLocalContactInfo({...localContactInfo, paymentRocket: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none font-bold"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSaveSettings}
          className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
        >
          <Save size={20} /> সব সেটিংস সেভ করুন
        </button>
      </div>
    </div>
  );

  const toggleUserVerification = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerified: !currentStatus
      });
      showNotification(`ইউজার ভেরিফিকেশন ${!currentStatus ? 'সফলভাবে সম্পন্ন' : 'বাতিল'} করা হয়েছে`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
      showNotification('ভেরিফিকেশন আপডেট করতে সমস্যা হয়েছে', 'error');
    }
  };

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-black">{language === 'bn' ? "ইউজার ম্যানেজমেন্ট" : "User Management"}</h2>
        <span className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
          Total Users: {usersList.length}
        </span>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800">
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">User Profile</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Contact Info</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Role</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Verification Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Last Activity</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {usersList.length > 0 ? usersList.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {u.photoURL ? (
                        <img src={u.photoURL} className="w-10 h-10 rounded-full border-2 border-primary/20" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                          <Users size={20} />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{u.displayName || 'Anonymous User'}</div>
                        <div className="text-[10px] text-neutral-400 font-bold">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      {u.phone ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400">
                          <Phone size={12} className="text-primary" />
                          {u.phone}
                        </div>
                      ) : (
                        <span className="text-[10px] text-neutral-300 italic">No Phone</span>
                      )}
                      {u.dob && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400">
                          <Calendar size={10} />
                          {u.dob}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-green-50 text-green-600'
                    }`}>
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       {u.isVerified ? (
                         <span className="flex items-center gap-1 text-[10px] font-black uppercase text-green-500 bg-green-50 px-2 py-1 rounded-lg">
                           <Check size={10} /> Verified
                         </span>
                       ) : (
                         <span className="flex items-center gap-1 text-[10px] font-black uppercase text-neutral-400 bg-neutral-100 px-2 py-1 rounded-lg">
                           <Ban size={10} /> Unverified
                         </span>
                       )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Calendar size={12} />
                      <span className="text-xs font-bold">
                        {u.lastLogin?.toDate ? u.lastLogin.toDate().toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => toggleUserVerification(u.id, u.isVerified || false)}
                      className={`p-2 rounded-xl transition-all ${u.isVerified ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}
                      title={u.isVerified ? "Unverify User" : "Verify User"}
                    >
                      {u.isVerified ? <Ban size={16} /> : <Check size={16} />}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-neutral-400 font-bold">কোন ইউজার পাওয়া যায়নি</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard size={18} /> },
    { id: 'products', label: 'প্রডাক্টস', icon: <ShoppingBag size={18} /> },
    { id: 'categories', label: 'মেইন ক্যাটাগরি', icon: <List size={18} /> },
    { id: 'sub-categories', label: 'সাব ক্যাটাগরি', icon: <List size={18} /> },
    { id: 'users', label: 'ইউজার্স', icon: <Users size={18} /> },
    { id: 'sliders', label: 'স্লাইডার', icon: <ImageIcon size={18} /> },
    { id: 'orders', label: 'অর্ডার্স', icon: <Package size={18} /> },
    { id: 'offers', label: 'অফার', icon: <Gift size={18} /> },
    { id: 'messages', label: 'নোটিশ', icon: <MessageSquare size={18} /> },
    { id: 'telegram', label: 'টেলিগ্রাম', icon: <Send size={18} /> },
    { id: 'steadfast', label: 'স্টেডফাস্ট কুরিয়ার', icon: <Truck size={18} /> },
    { id: 'social-links', label: 'সোশ্যাল লিংক', icon: <Share2 size={18} /> },
    { id: 'appearance', label: 'সেটিংস্', icon: <Settings size={18} /> }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col md:flex-row relative">
        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 w-full bg-white dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-900 z-[400] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-primary/20 text-xs">A</div>
            <span className="font-black text-lg">Admin</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Backdrop for Mobile Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              key="mobile-sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[450]"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`
          fixed md:sticky top-0 z-[500] md:z-0
          w-72 h-screen bg-white dark:bg-neutral-950 border-r border-neutral-100 dark:border-neutral-900 p-8 
          flex flex-col transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-primary/20">A</div>
            <span className="font-black text-xl">Admin Panel</span>
          </div>
          <nav className="space-y-1 overflow-y-auto pr-2 pb-4 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={(e) => { 
                  e.preventDefault(); 
                  setActiveTab(tab.id as AdminTab);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl font-bold transition-all ${
                  activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="px-6 py-2">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">Logged in as</p>
              <p className="text-[11px] font-black text-neutral-600 dark:text-neutral-300 truncate">{user?.email}</p>
            </div>
            
            <button 
              onClick={() => logout()} 
              className="w-full flex items-center gap-4 px-6 py-3.5 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl transition-all"
            >
              <LogOut size={18} /> লগ আউট
            </button>

            <button 
              onClick={() => navigate('/')} 
              className="w-full flex items-center gap-4 px-6 py-3.5 text-neutral-400 font-bold hover:text-primary transition-colors"
            >
              <ChevronRight size={18} className="rotate-180" /> শপে ফিরে যান
            </button>
          </div>
        </aside>

        <main className="flex-grow p-4 md:p-12 mt-16 md:mt-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl mx-auto"
            >
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'products' && renderProducts()}
              {activeTab === 'categories' && renderCategories()}
              {activeTab === 'sub-categories' && renderSubcategories()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'sliders' && renderSliders()}
              {activeTab === 'orders' && renderOrders()}
              {activeTab === 'offers' && renderOffers()}
              {activeTab === 'social-links' && renderSocialLinks()}
              {activeTab === 'messages' && renderMessages()}
              {activeTab === 'telegram' && renderTelegram()}
              {activeTab === 'steadfast' && renderSteadfast()}
              {activeTab === 'appearance' && renderAppearance()}
            </motion.div>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {selectedOrder && (
            <div 
              key="invoice-modal"
              className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div 
                  ref={invoiceRef}
                  initial={{opacity: 0, y: 20}} 
                  animate={{opacity: 1, y: 0}} 
                  className="bg-white dark:bg-neutral-900 w-full max-w-2xl max-h-[90vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl print:max-w-none print:bg-white print:shadow-none print:rounded-none print:h-auto print:max-h-none print-invoice font-sans"
                >
                  {/* Top Toolbar - Hidden in Print */}
                  <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50 no-print">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                           <FileText size={16} />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-tight">
                          {language === 'bn' ? 'অর্ডার ডিটেইলস' : 'Order Details'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={downloadInvoice}
                          disabled={isDownloading}
                          className={`flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all font-bold text-xs ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                           {isDownloading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={14} />}
                           <span>{isDownloading ? (language === 'bn' ? 'ডাউনলোড হচ্ছে...' : 'Downloading...') : (language === 'bn' ? 'ইনভয়েস ডাউনলোড' : 'Save PDF')}</span>
                        </button>
                        <button onClick={() => { setSelectedOrder(null); setShowInvoicePreview(false); }} className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-red-50 text-red-500 transition-all">
                           <X size={16} />
                        </button>
                      </div>
                  </div>

                  {/* Modal Content - Scrollable area */}
                  <div className="flex-grow overflow-y-auto bg-neutral-50 dark:bg-neutral-900 no-scrollbar">
                     {/* Admin Tools: Hidden in Print, shown first in UI */}
                     <div className="no-print p-6 md:p-10 max-w-xl mx-auto space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Order Status</label>
                              <div className="relative">
                                 <select 
                                   value={selectedOrder.status}
                                   onChange={(e) => {
                                     updateOrderStatus(selectedOrder.id, e.target.value as any);
                                     setSelectedOrder({...selectedOrder, status: e.target.value as any});
                                     showNotification(`Status updated to ${e.target.value}`);
                                   }}
                                   className="w-full bg-white dark:bg-neutral-800 border-none text-xs font-bold uppercase rounded-xl pl-5 pr-10 py-4 appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                 >
                                   <option value="Pending">Pending</option>
                                   <option value="Processing">Processing</option>
                                   <option value="Shipped">Shipped</option>
                                   <option value="Completed">Completed</option>
                                   <option value="Cancelled">Cancelled</option>
                                 </select>
                                 <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Payment Status</label>
                              <div className="flex gap-2">
                                 <button 
                                   onClick={() => {
                                     updateOrder(selectedOrder.id, { paymentStatus: 'Approved' });
                                     setSelectedOrder({...selectedOrder, paymentStatus: 'Approved'});
                                     showNotification('Payment Approved');
                                   }}
                                   className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all shadow-sm ${selectedOrder.paymentStatus === 'Approved' ? 'bg-green-500 text-white' : 'bg-white dark:bg-neutral-800 text-neutral-500 hover:text-green-500'}`}
                                 >
                                   Approve
                                 </button>
                                 <button 
                                   onClick={() => {
                                     updateOrder(selectedOrder.id, { paymentStatus: 'Rejected' });
                                     setSelectedOrder({...selectedOrder, paymentStatus: 'Rejected'});
                                     showNotification('Payment Rejected', 'error');
                                   }}
                                   className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all shadow-sm ${selectedOrder.paymentStatus === 'Rejected' ? 'bg-red-500 text-white' : 'bg-white dark:bg-neutral-800 text-neutral-500 hover:text-red-500'}`}
                                 >
                                   Reject
                                 </button>
                              </div>
                           </div>
                        </div>

                        {selectedOrder.paymentMethod !== 'Cash on Delivery' && (selectedOrder.transactionId || selectedOrder.lastNumber) && (
                           <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 space-y-3">
                              <div className="flex items-center gap-2 text-primary">
                                 <CreditCard size={14} />
                                 <span className="text-[10px] font-black uppercase tracking-widest">
                                    {language === 'bn' ? 'পেমেন্ট ট্রাঞ্জেকশন' : 'Payment Transaction'}
                                 </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 {selectedOrder.transactionId && (
                                    <div className="space-y-1">
                                       <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">{language === 'bn' ? 'ট্রানজেকশন আইডি' : 'TRX ID'}</p>
                                       <div className="flex items-center gap-2">
                                          <p className="text-xs font-black text-neutral-900 dark:text-white select-all break-all">{selectedOrder.transactionId}</p>
                                          <button 
                                            onClick={() => {
                                              navigator.clipboard.writeText(selectedOrder.transactionId || "");
                                              showNotification("Transaction ID copied");
                                            }}
                                            className="p-1 hover:bg-primary/10 rounded text-primary transition-colors"
                                          >
                                            <Copy size={12} />
                                          </button>
                                       </div>
                                    </div>
                                 )}
                                 {selectedOrder.lastNumber && (
                                    <div className="space-y-1">
                                       <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">{language === 'bn' ? 'লাস্ট নাম্বার' : 'Last Number'}</p>
                                       <p className="text-xs font-black text-neutral-900 dark:text-white">{selectedOrder.lastNumber}</p>
                                    </div>
                                 )}
                              </div>
                           </div>
                        )}

                        {/* Steadfast Courier Dispatch & Tracking Section */}
                        <div className="p-5 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                              <Truck size={16} />
                              <span className="text-xs font-black uppercase tracking-wider">
                                স্টেডফাস্ট কুরিয়ার (Steadfast Courier)
                              </span>
                            </div>
                            {selectedOrder.steadfastTrackingCode && (
                              <span className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
                                {selectedOrder.steadfastStatus ? formatSteadfastStatus(selectedOrder.steadfastStatus) : 'Booked'}
                              </span>
                            )}
                          </div>

                          {selectedOrder.steadfastTrackingCode ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl shadow-sm">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-neutral-400">কনসাইনমেন্ট আইডি</p>
                                  <p className="font-mono font-bold text-neutral-900 dark:text-white mt-0.5">#{selectedOrder.steadfastConsignmentId || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl shadow-sm">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-neutral-400">ট্র্যাকিং কোড</p>
                                  <div className="flex items-center justify-between mt-0.5">
                                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{selectedOrder.steadfastTrackingCode}</span>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(selectedOrder.steadfastTrackingCode || "");
                                        showNotification("Tracking code copied!");
                                      }}
                                      className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-neutral-400"
                                      title="Copy Tracking Code"
                                    >
                                      <Copy size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button 
                                  onClick={() => handleSyncSteadfastStatus(selectedOrder)}
                                  disabled={syncingOrderId === selectedOrder.id}
                                  className="flex-1 py-2.5 px-4 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-700 transition-all shadow-sm"
                                >
                                  <RefreshCw size={13} className={syncingOrderId === selectedOrder.id ? 'animate-spin' : ''} />
                                  <span>লাইভ স্ট্যাটাস আপডেট করুন</span>
                                </button>
                                {selectedOrder.trackingLink && (
                                  <a 
                                    href={selectedOrder.trackingLink} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                                  >
                                    <ExternalLink size={13} />
                                    <span>ট্র্যাকিং পেজ দেখুন</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">এখনও Steadfast-এ বুকিং করা হয়নি</p>
                                <p className="text-[10px] text-neutral-400">১-ক্লিকে কুরিয়ার পার্সেল বুকিং করুন</p>
                              </div>
                              <button 
                                onClick={() => openDispatchModal(selectedOrder)}
                                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all shrink-0"
                              >
                                <Send size={13} />
                                <span>Steadfast এ বুক করুন</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Tracking (Courier Link)</label>
                           <div className="flex gap-2">
                             <div className="relative flex-grow">
                               <Truck size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                               <input 
                                 id="admin-tracking-link-input"
                                 type="text" 
                                 placeholder="Paste tracking URL here..."
                                 defaultValue={selectedOrder.trackingLink || ''}
                                 className="w-full bg-white dark:bg-neutral-800 border-none rounded-xl pl-11 pr-4 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                               />
                             </div>
                             <button 
                               onClick={() => {
                                 const input = document.getElementById('admin-tracking-link-input') as HTMLInputElement;
                                 if (input) {
                                   updateOrder(selectedOrder.id, { trackingLink: input.value });
                                   setSelectedOrder({...selectedOrder, trackingLink: input.value});
                                   showNotification('Tracking saved');
                                 }
                               }}
                               className="px-6 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20"
                             >
                               Save
                             </button>
                           </div>
                        </div>

                        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
                          <button 
                            onClick={() => downloadInvoice()}
                            disabled={isDownloading}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg"
                          >
                            <Download size={18} /> 
                            {isDownloading ? (language === 'bn' ? 'ডাউনলোড হচ্ছে...' : 'Downloading...') : (language === 'bn' ? 'ডাউনলোড ইনভয়েস' : 'Download Invoice')}
                          </button>
                          <div className="text-center">
                            <button 
                              onClick={() => setShowInvoicePreview(!showInvoicePreview)}
                              className="inline-flex items-center gap-2 px-6 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                            >
                              <Printer size={14} /> 
                              {showInvoicePreview ? (language === 'bn' ? 'প্রিভিউ লুকান' : 'Hide Preview') : (language === 'bn' ? 'প্রিভিউ ইনভয়েস' : 'Preview Invoice')}
                            </button>
                          </div>
                        </div>
                     </div>

                     {/* The Invoice Preview - Hidden by default in UI, always visible for print/download */}
                     {(showInvoicePreview || isDownloading) && (
                        <div className="bg-white text-neutral-900 border-t border-neutral-100 print:border-none">
                           <div className="p-10 print:p-0 flex flex-col items-center" ref={invoiceRef}>
                                 <div className="max-w-xl mx-auto space-y-6 bg-white border border-neutral-100 p-8 print:border-neutral-100 print:p-6 print:h-[148mm] print:overflow-hidden">
                                    {/* Header */}
                                    <div className="flex justify-between items-start border-b border-neutral-100 pb-4">
                                       <div className="space-y-0.5 text-left">
                                          <h2 className="text-lg font-black tracking-tight text-primary">{contactInfo.name || 'Gadget Galaxy BD'}</h2>
                                          <p className="text-[9px] text-neutral-500 font-medium italic">সততা ও বিশ্বাস এ আমরা অবিচল</p>
                                          <div className="pt-2 space-y-0.5 text-[9px] text-neutral-500 font-medium">
                                            <p className="flex items-center gap-1.5"><MapPin size={8} /> {contactInfo.address}</p>
                                            <p className="flex items-center gap-1.5"><Phone size={8} /> {contactInfo.phone}</p>
                                          </div>
                                       </div>
                                       <div className="text-right space-y-1">
                                          <div className="inline-block px-2 py-0.5 bg-neutral-100 rounded-full text-[8px] font-bold uppercase tracking-widest text-neutral-600">
                                            Invoice
                                          </div>
                                          <p className="text-sm font-black tracking-tighter text-neutral-900">#{selectedOrder.id.slice(-8).toUpperCase()}</p>
                                          <p className="text-[9px] font-bold text-neutral-400 uppercase">
                                            {(() => {
                                              try {
                                                const date = selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate() : new Date(selectedOrder.createdAt);
                                                return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                              } catch (e) {
                                                return 'N/A';
                                              }
                                            })()}
                                          </p>
                                       </div>
                                    </div>

                                    {/* Customer & Order Info */}
                                    <div className="grid grid-cols-2 gap-6">
                                       <div className="space-y-1.5 text-left">
                                          <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">Bill To</p>
                                          <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-neutral-900">{selectedOrder.customerInfo.name}</p>
                                            <p className="text-[10px] font-medium text-neutral-600">{selectedOrder.customerInfo.phone}</p>
                                            <p className="text-[10px] text-neutral-500 leading-relaxed italic">
                                              {selectedOrder.customerInfo.address}, {selectedOrder.customerInfo.area}
                                            </p>
                                          </div>
                                       </div>
                                       <div className="space-y-1.5 text-right">
                                          <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">Payment</p>
                                          <div className="space-y-0.5">
                                            <p className="text-[10px] font-bold uppercase text-neutral-700">
                                              {selectedOrder.paymentMethod === 'Cash on Delivery' ? (language === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery') : (language === 'bn' ? 'অনলাইন পেমেন্ট' : 'Online Payment')}
                                            </p>
                                            <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter ${
                                              selectedOrder.paymentStatus === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'
                                            }`}>
                                              {selectedOrder.paymentStatus || 'PENDING'}
                                            </div>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Order Items Table */}
                                    <div className="space-y-2">
                                       <table className="w-full text-left border-collapse">
                                          <thead>
                                             <tr className="border-b border-neutral-100 text-[8px] font-bold uppercase tracking-widest text-neutral-400">
                                                <th className="pb-2">Description</th>
                                                <th className="pb-2 text-center">Qty</th>
                                                <th className="pb-2 text-right">Total</th>
                                             </tr>
                                          </thead>
                                          <tbody className="divide-y divide-neutral-50">
                                             {selectedOrder.items.map((item, idx) => (
                                                <tr key={idx} className="text-[11px] font-medium">
                                                   <td className="py-2 text-neutral-800">{item.name}</td>
                                                   <td className="py-2 text-center text-neutral-500">{item.quantity}</td>
                                                   <td className="py-2 text-right font-bold text-neutral-900">৳{item.price * item.quantity}</td>
                                                </tr>
                                             ))}
                                          </tbody>
                                       </table>
                                    </div>

                                    {/* Totals Section */}
                                    <div className="flex justify-end border-t border-neutral-100 pt-4">
                                       <div className="w-48 space-y-1 px-1">
                                          <div className="flex justify-between items-center text-[9px] font-bold text-neutral-500 uppercase px-1">
                                             <span>Subtotal</span>
                                             <span>৳{selectedOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)}</span>
                                          </div>
                                          {selectedOrder.deliveryFee > 0 && (
                                            <div className="flex justify-between items-center text-[9px] font-bold text-neutral-500 uppercase px-1">
                                               <span>Delivery Fee</span>
                                               <span>৳{selectedOrder.deliveryFee}</span>
                                            </div>
                                          )}
                                          {selectedOrder.serviceCharge > 0 && (
                                            <div className="flex justify-between items-center text-[9px] font-bold text-neutral-500 uppercase px-1">
                                               <span>COD Fee</span>
                                               <span>৳{selectedOrder.serviceCharge}</span>
                                            </div>
                                          )}
                                          <div className="flex justify-between items-center bg-neutral-100 p-2 rounded-lg mt-2">
                                             <span className="text-[10px] font-bold text-neutral-900 uppercase">Grand Total</span>
                                             <span className="text-sm font-black text-primary tracking-tighter">৳{selectedOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0) + (selectedOrder.deliveryFee || 0) + (selectedOrder.serviceCharge || 0)}</span>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Shop Policy/Thank you */}
                                    <div className="pt-2 text-center">
                                       <p className="text-[8px] text-neutral-400 font-bold uppercase tracking-widest italic">Thank you for your order!</p>
                                    </div>
                                 </div>
                           </div>
                        </div>
                     )}
                  </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>

        <AnimatePresence>
          {isScreenLocked && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] bg-white dark:bg-neutral-950 flex items-center justify-center p-8 backdrop-blur-xl"
            >
              <div className="max-w-sm w-full text-center space-y-8">
                <div className="w-24 h-24 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto animate-pulse">
                   <div className="relative">
                      <Lock size={48} />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-4 border-white dark:border-neutral-950" 
                      />
                   </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black">Admin Locked</h2>
                  <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Inactive for 5 minutes</p>
                </div>
                <button 
                  onClick={() => setIsScreenLocked(false)}
                  className="w-full py-5 bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white rounded-2xl font-black shadow-xl shadow-neutral-500/20 active:scale-95 transition-transform"
                >
                  Unlock Session
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {notification && (
            <motion.div
              key="notification-toast"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-primary/20 no-print"
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        <style>
          {`
            @media print {
              /* Hide everything by default */
              body * {
                visibility: hidden !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Show ONLY the invoice container and its contents */
              .print-invoice, .print-invoice * {
                visibility: visible !important;
                display: block !important;
                color: black !important;
              }
              .print-invoice {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                background: white !important;
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 15mm !important;
                z-index: 999999 !important;
                overflow: visible !important;
                border-radius: 0 !important;
              }
              /* Hide interactive elements inside invoice during print */
              .no-print, .no-print * {
                display: none !important;
                visibility: hidden !important;
              }
              /* Fix for grid/flex layouts if they disappear */
              .print-invoice .flex { display: flex !important; }
              .print-invoice .grid { display: grid !important; }
              .print-invoice .justify-between { justify-content: space-between !important; }
              .print-invoice .items-center { align-items: center !important; }
              .print-invoice .gap-8 { gap: 2rem !important; }
              /* Force backgrounds for UI elements if needed */
              .bg-neutral-50 { background-color: #f9fafb !important; }
            }
          `}
        </style>

        {/* Product Modal */}
        {isProductModalOpen && editingProduct && (
           <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
             <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] w-full max-w-2xl my-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black">{editingProduct.id ? 'প্রডাক্ট ইডিট' : 'নতুন প্রডাক্ট'}</h3>
                  <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-xl"><X size={20}/></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                      <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Product Name</label>
                            <input type="text" value={editingProduct.name || ''} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Normal Price (৳)</label>
                                <input type="number" value={editingProduct.price || ''} onChange={e => {
                                    const newPrice = parseInt(e.target.value) || 0;
                                    const original = editingProduct.originalPrice || 0;
                                    let disc = editingProduct.discount;
                                    if (original > newPrice && original > 0) {
                                        const p = Math.round(((original - newPrice) / original) * 100);
                                        disc = `${p}% OFF`;
                                    } else {
                                        disc = '';
                                    }
                                    setEditingProduct({...editingProduct, price: newPrice, discount: disc});
                                }} className="w-full px-5 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Original Price (৳)</label>
                                <input type="number" value={editingProduct.originalPrice || ''} onChange={e => {
                                    const original = parseInt(e.target.value) || 0;
                                    const curr = editingProduct.price || 0;
                                    let disc = editingProduct.discount;
                                    if (original > curr && original > 0) {
                                        const p = Math.round(((original - curr) / original) * 100);
                                        disc = `${p}% OFF`;
                                    } else {
                                        disc = '';
                                    }
                                    setEditingProduct({...editingProduct, originalPrice: original, discount: disc});
                                }} className="w-full px-5 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 font-bold" />
                            </div>
                        </div>
                        {editingProduct.discount && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-lg font-black uppercase tracking-widest">Auto Calculated Discount: {editingProduct.discount}</span>
                            </div>
                        )}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Category</label>
                        <select 
                          value={editingProduct.category || ''} 
                          onChange={e => setEditingProduct({...editingProduct, category: e.target.value, subCategory: ''})} 
                          className="w-full px-5 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 font-bold"
                        >
                           <option value="">Select Category</option>
                           {Object.keys(categories).map(k => <option key={k} value={k}>{categories[k].name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Sub Category</label>
                        <select 
                          value={editingProduct.subCategory || ''} 
                          onChange={e => setEditingProduct({...editingProduct, subCategory: e.target.value})} 
                          className="w-full px-5 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 font-bold"
                          disabled={!editingProduct.category}
                        >
                           <option value="">Select Sub-Category</option>
                           {editingProduct.category && categories[editingProduct.category]?.subcategories ? categories[editingProduct.category].subcategories.map((sub: any) => (
                             <option key={sub.id || sub.name} value={sub.id || sub.name}>{sub.name}</option>
                           )) : null}
                        </select>
                     </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Main Image</label>
                       <div className="flex gap-4">
                         {editingProduct.image && (
                           <img src={editingProduct.image} className="w-16 h-16 object-cover rounded-xl" alt="" />
                         )}
                         <label className="flex-1 cursor-pointer">
                           <div className="w-full h-16 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-center gap-2 text-neutral-400 font-bold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                             <Camera size={16} /> ফটো সিলেক্ট করুন
                           </div>
                           <input 
                             type="file" 
                             accept="image/*" 
                             className="hidden" 
                             onChange={e => handleImageUpload(e, (url) => setEditingProduct({...editingProduct, image: url}))}
                           />
                         </label>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Gallery Images (Side Pics)</label>
                       <div className="grid grid-cols-4 gap-2 mb-2">
                         {(editingProduct.gallery || []).map((img, idx) => (
                           <div key={idx} className="relative group aspect-square">
                             <img src={img} className="w-full h-full object-cover rounded-lg border border-neutral-100 dark:border-neutral-800" alt="" />
                             <button 
                               onClick={() => {
                                 const newGallery = (editingProduct.gallery || []).filter((_, i) => i !== idx);
                                 setEditingProduct({...editingProduct, gallery: newGallery});
                               }}
                               className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                               <X size={8} />
                             </button>
                           </div>
                         ))}
                         {(editingProduct.gallery || []).length < 6 && (
                           <label className="cursor-pointer aspect-square rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                             <Plus size={16} />
                             <input 
                               type="file" 
                               accept="image/*" 
                               className="hidden" 
                               onChange={e => handleImageUpload(e, (url) => {
                                 const gallery = [...(editingProduct.gallery || []), url];
                                 setEditingProduct({...editingProduct, gallery});
                               })}
                             />
                           </label>
                         )}
                       </div>
                    </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Description</label>
                       <textarea value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 font-bold min-h-[100px]" />
                     </div>
                  </div>
                </div>

                {/* Colors & Sizes Tags Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center justify-between">
                        Colors / Tags
                        <span className="text-[8px] normal-case opacity-60 font-bold text-primary">Enter দিয়ে এড করুন</span>
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2 min-h-[32px] p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                        {editingProduct.colors?.map((color, index) => (
                          <span key={index} className="px-2 py-1 bg-primary text-white rounded text-[10px] font-black flex items-center gap-1">
                            {color}
                            <button type="button" onClick={() => setEditingProduct({...editingProduct, colors: editingProduct.colors?.filter((_, i) => i !== index)})}>
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={colorInput} 
                          onChange={e => setColorInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (colorInput.trim()) {
                                const t = colorInput.trim();
                                if (!editingProduct.colors?.includes(t)) {
                                  setEditingProduct({...editingProduct, colors: [...(editingProduct.colors || []), t]});
                                }
                                setColorInput('');
                              }
                            }
                          }}
                          placeholder="Add color..."
                          className="flex-1 px-4 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center justify-between">
                        Sizes / Tags
                        <span className="text-[8px] normal-case opacity-60 font-bold text-primary">Enter দিয়ে এড করুন</span>
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2 min-h-[32px] p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                        {editingProduct.sizes?.map((size, index) => (
                          <span key={index} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded text-[10px] font-black flex items-center gap-1">
                            {size}
                            <button type="button" onClick={() => setEditingProduct({...editingProduct, sizes: editingProduct.sizes?.filter((_, i) => i !== index)})}>
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={sizeInput} 
                          onChange={e => setSizeInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (sizeInput.trim()) {
                                const t = sizeInput.trim();
                                if (!editingProduct.sizes?.includes(t)) {
                                  setEditingProduct({...editingProduct, sizes: [...(editingProduct.sizes || []), t]});
                                }
                                setSizeInput('');
                              }
                            }
                          }}
                          placeholder="Add size..."
                          className="flex-1 px-4 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={async () => {
                    try {
                      if (!editingProduct.name) return showNotification('প্রডাক্টের নাম দিন', 'error');
                      if (editingProduct.id) {
                        await updateProduct(editingProduct as Product);
                      } else {
                        await addProduct(editingProduct as Product);
                      }
                      setIsProductModalOpen(false);
                      showNotification('প্রডাক্ট সফলভাবে সেভ করা হয়েছে!');
                    } catch (err) {
                      showNotification('প্রডাক্ট সেভ করতে সমস্যা হয়েছে', 'error');
                    }
                  }}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-lg mt-8"
                >
                  Save Product
                </button>
             </motion.div>
           </div>
        )}

        {/* Slider Modal */}
        {editingSlider && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] w-full max-w-lg">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black">স্লাইডার ইডিট</h3>
                  <button onClick={() => setEditingSlider(null)} className="p-2 hover:bg-neutral-100 rounded-xl"><X size={20}/></button>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Title</label>
                      <input type="text" value={editingSlider.title || ''} onChange={e => setEditingSlider({...editingSlider, title: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 font-bold" />
                   </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Image</label>
                       <div className="flex gap-4">
                         {editingSlider.image && (
                           <img src={editingSlider.image} className="w-20 h-10 object-cover rounded-xl" alt="" />
                         )}
                         <label className="flex-1 cursor-pointer">
                           <div className="w-full h-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-center gap-2 text-neutral-400 font-bold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                             <Camera size={16} /> গ্যালারি থেকে ছবি নিন
                           </div>
                           <input 
                             type="file" 
                             accept="image/*" 
                             className="hidden" 
                             onChange={e => handleImageUpload(e, (url) => setEditingSlider({...editingSlider, image: url}))}
                           />
                         </label>
                       </div>
                    </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Link (Optional)</label>
                      <input type="text" value={editingSlider.link || ''} onChange={e => setEditingSlider({...editingSlider, link: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 font-bold" />
                   </div>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      if (!editingSlider.image) return showNotification('স্লাইডার ইমেজ দিন', 'error');
                      if (editingSlider.id) {
                        await updateSlider(editingSlider.id, editingSlider);
                      } else {
                        await addSlider({ ...editingSlider, id: `slider-${Date.now()}` } as any);
                      }
                      setEditingSlider(null);
                      showNotification('স্লাইডার সেভ করা হয়েছে!');
                    } catch (err) {
                      showNotification('স্লাইডার সেভ করতে সমস্যা হয়েছে', 'error');
                    }
                  }}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-lg mt-8"
                >
                  Save Slider
                </button>
             </motion.div>
          </div>
        )}

        {/* Offer Modal */}
        {editingOffer && (
           <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] w-full max-w-lg">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black">Offer Details</h3>
                  <button onClick={() => setEditingOffer(null)} className="p-2 hover:bg-neutral-100 rounded-xl"><X size={20}/></button>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Offer Title</label>
                      <input type="text" value={editingOffer.title || ''} onChange={e => setEditingOffer({...editingOffer, title: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 font-bold" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Description</label>
                      <input type="text" value={editingOffer.description || ''} onChange={e => setEditingOffer({...editingOffer, description: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 font-bold" />
                   </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Image</label>
                       <div className="flex gap-4">
                         {editingOffer.image && (
                           <img src={editingOffer.image} className="w-16 h-16 object-cover rounded-xl" alt="" />
                         )}
                         <label className="flex-1 cursor-pointer">
                           <div className="w-full h-16 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-center gap-2 text-neutral-400 font-bold text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                             <Camera size={16} /> ইমেজ আপলোড
                           </div>
                           <input 
                             type="file" 
                             accept="image/*" 
                             className="hidden" 
                             onChange={e => handleImageUpload(e, (url) => setEditingOffer({...editingOffer, image: url}))}
                           />
                         </label>
                       </div>
                    </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Badge</label>
                        <input type="text" value={editingOffer.badge || ''} onChange={e => setEditingOffer({...editingOffer, badge: e.target.value})} placeholder="e.g. 50% OFF" className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Status</label>
                        <select value={editingOffer.status} onChange={e => setEditingOffer({...editingOffer, status: e.target.value as any})} className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 font-bold">
                           <option value="active">Active</option>
                           <option value="hidden">Hidden</option>
                        </select>
                      </div>
                   </div>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      if (!editingOffer.title) return showNotification('অফার টাইটেল দিন', 'error');
                      if (editingOffer.id) {
                        await updateOffer(editingOffer.id, editingOffer);
                      } else {
                        await addOffer({ ...editingOffer, id: `offer-${Date.now()}` } as Offer);
                      }
                      setEditingOffer(null);
                      showNotification('অফার সেভ করা হয়েছে!');
                    } catch (err) {
                      showNotification('অফার সেভ করতে সমস্যা হয়েছে', 'error');
                    }
                  }}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-lg mt-8"
                >
                  Save Offer
                </button>
             </motion.div>
           </div>
        )}
        {/* Steadfast Dispatch Modal */}
        {dispatchingOrder && (
          <div className="fixed inset-0 z-[650] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-neutral-100 dark:border-neutral-800">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">স্টেডফাস্ট কুরিয়ারে বুকিং</h3>
                    <p className="text-xs text-neutral-400 font-medium">ইনভয়েস: INV-{dispatchingOrder.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
                <button onClick={() => setDispatchingOrder(null)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                  <X size={20}/>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">প্রাপকের নাম (Recipient Name)</label>
                  <input 
                    type="text" 
                    value={dispatchForm.name} 
                    onChange={e => setDispatchForm({ ...dispatchForm, name: e.target.value })} 
                    className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 font-bold text-sm border-none" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">মোবাইল নম্বর (Phone Number)</label>
                  <input 
                    type="text" 
                    value={dispatchForm.phone} 
                    onChange={e => setDispatchForm({ ...dispatchForm, phone: e.target.value })} 
                    className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 font-bold text-sm border-none" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">ডেলিভারি ঠিকানা (Full Address)</label>
                  <textarea 
                    rows={2}
                    value={dispatchForm.address} 
                    onChange={e => setDispatchForm({ ...dispatchForm, address: e.target.value })} 
                    className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 font-bold text-sm border-none resize-none" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">ক্যাশ অন ডেলিভারি (COD ৳)</label>
                    <input 
                      type="number" 
                      value={dispatchForm.codAmount} 
                      onChange={e => setDispatchForm({ ...dispatchForm, codAmount: Number(e.target.value) })} 
                      className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 font-bold text-sm border-none" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">পেমেন্ট মেথড</label>
                    <div className="px-5 py-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 font-bold text-xs text-neutral-600 dark:text-neutral-300">
                      {dispatchingOrder.paymentMethod}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">পার্সেল নোট (Delivery Note)</label>
                  <input 
                    type="text" 
                    value={dispatchForm.note} 
                    onChange={e => setDispatchForm({ ...dispatchForm, note: e.target.value })} 
                    placeholder="সাবধান ভঙ্গুর / Handle with Care"
                    className="w-full px-5 py-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 font-bold text-sm border-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setDispatchingOrder(null)} 
                  className="py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-2xl font-black text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  বাতিল
                </button>
                <button 
                  type="button"
                  onClick={handleConfirmDispatch}
                  disabled={isDispatching}
                  className="py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDispatching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>বুকিং হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>বুকিং কনফার্ম করুন</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirmId && (
            <div 
              key="delete-confirm-modal"
              className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] max-w-sm w-full text-center"
              >
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 size={40} />
                </div>
                <h3 className="text-2xl font-black mb-2">প্রডাক্ট ডিলিট?</h3>
                <p className="text-neutral-500 mb-8">নিশ্চিত তো? এটি আর ফিরিয়ে আনা যাবে না।</p>
                <div className="flex gap-4">
                  <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 bg-neutral-100 rounded-2xl font-black">না</button>
                  <button onClick={async () => {
                    try {
                      await removeProduct(deleteConfirmId);
                      showNotification('প্রডাক্ট ডিলিট করা হয়েছে');
                    } catch (err) {
                      showNotification('প্রডাক্ট ডিলিট করতে সমস্যা হয়েছে', 'error');
                    }
                    setDeleteConfirmId(null);
                  }} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black">হ্যাঁ</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
