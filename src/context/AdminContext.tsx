import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { ALL_PRODUCTS, CATEGORY_DATA } from '../data';
import { Product, Category, Offer, Subcategory, Slider, SteadfastSettings } from '../types';
import { sanitizeImageBase64 } from '../utils/imageCompressor';

export interface TelegramSettings {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
}

export type { SteadfastSettings };

export interface ContactInfo {
  phone: string;
  email: string;
  supportLink: string;
  whatsappNumber: string;
  telegramLink: string;
  youtubeLink?: string;
  tiktokLink?: string;
  paymentBkash: string;
  paymentNagad: string;
  paymentRocket: string;
  address: string;
  name?: string;
  isAppLocked?: boolean;
}

export interface Area {
  id: string;
  name: string;
  charge: number;
}

export interface ShippingSettings {
  freeDeliveryThreshold: number;
  defaultFee: number;
  insideDhakaFee: number;
  outsideDhakaFee: number;
}

interface AdminContextType {
  products: Product[];
  categories: Record<string, Category>;
  offers: Offer[];
  telegramSettings: TelegramSettings;
  steadfastSettings: SteadfastSettings;
  sliders: Slider[];
  areas: Area[];
  shippingSettings: ShippingSettings;
  scrollingMessage: string;
  contactInfo: ContactInfo;
  setScrollingMessage: (msg: string) => void;
  setContactInfo: (info: ContactInfo) => void;
  setShippingSettings: (settings: ShippingSettings) => void;
  setTelegramSettings: (settings: TelegramSettings) => void;
  setSteadfastSettings: (settings: SteadfastSettings) => Promise<void>;
  addSlider: (slider: Slider) => void;
  removeSlider: (id: string) => void;
  updateSlider: (id: string, data: Partial<Slider>) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  addCategory: (data: Category) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  addOffer: (offer: Offer) => void;
  updateOffer: (id: string, data: Partial<Offer>) => void;
  removeOffer: (id: string) => void;
  addArea: (area: Omit<Area, 'id'>) => void;
  updateArea: (id: string, area: Partial<Area>) => void;
  removeArea: (id: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [offers, setOffers] = useState<Offer[]>([]);
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [scrollingMessage, setScrollingMessageState] = useState("");
  const [contactInfo, setContactInfoState] = useState<ContactInfo>({
    phone: "", email: "", supportLink: "", whatsappNumber: "", telegramLink: "",
    youtubeLink: "", tiktokLink: "",
    paymentBkash: "", paymentNagad: "", paymentRocket: "", address: "", name: "",
    isAppLocked: false
  });
  const [shippingSettings, setShippingSettingsState] = useState<ShippingSettings>({
    freeDeliveryThreshold: 2000, defaultFee: 60, insideDhakaFee: 60, outsideDhakaFee: 120
  });
  const [telegramSettings, setTelegramSettingsState] = useState<TelegramSettings>({
    botToken: "", chatId: "", isEnabled: false
  });
  const [steadfastSettings, setSteadfastSettingsState] = useState<SteadfastSettings>({
    apiKey: "", secretKey: "", isEnabled: false, autoBooking: false, defaultNote: "Handle with Care"
  });

  // Fetch data from Firestore
  useEffect(() => {
    if (loading) return;

    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      if (snapshot.empty && isAdmin) {
        // Initial seed if empty and user is admin
        ALL_PRODUCTS.forEach(p => setDoc(doc(db, "products", String(p.id)), p));
      } else {
        setProducts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product)));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, "products"));

    const unsubCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
      if (snapshot.empty && isAdmin) {
        Object.entries(CATEGORY_DATA).forEach(([id, cat]) => setDoc(doc(db, "categories", id), { ...cat, id }));
      } else {
        const cats: Record<string, Category> = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data() as any;
          cats[doc.id] = { 
            ...data, 
            subcategories: data.subcategories || data.subCategories || []
          } as Category;
        });
        setCategories(cats);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, "categories"));

    const unsubConfigs = onSnapshot(doc(db, "configs", "main"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.scrollingMessage) setScrollingMessageState(data.scrollingMessage);
        if (data.contactInfo) setContactInfoState(data.contactInfo);
        if (data.shippingSettings) setShippingSettingsState(data.shippingSettings);
        if (data.telegramSettings) setTelegramSettingsState(data.telegramSettings);
        if (data.steadfastSettings) setSteadfastSettingsState(data.steadfastSettings);
        if (data.sliders) setSliders(data.sliders);
        if (data.areas) setAreas(data.areas);
      } else if (isAdmin) {
        // Seed default config only if admin
        setDoc(doc(db, "configs", "main"), {
          scrollingMessage: "আমাদের শপে আপনাকে স্বাগতম!",
          contactInfo: {
            phone: "+৮৮০১৭১১-২২৩৩৪৪", email: "support@shop.com", supportLink: "", whatsappNumber: "", telegramLink: "",
            youtubeLink: "", tiktokLink: "",
            paymentBkash: "", paymentNagad: "", paymentRocket: "", address: "", name: "Shop Name",
            isAppLocked: false
          },
          shippingSettings: { freeDeliveryThreshold: 2000, defaultFee: 60, insideDhakaFee: 60, outsideDhakaFee: 120 },
          telegramSettings: { botToken: "", chatId: "", isEnabled: false },
          steadfastSettings: { apiKey: "", secretKey: "", isEnabled: false, autoBooking: false, defaultNote: "Handle with Care" },
          sliders: [
            { id: "1", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200", title: "New Season Style" },
            { id: "2", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200", title: "Smart Gadgets Edition" }
          ],
          areas: [
            { id: "1", name: "ঢাকা সিটি (Dhaka City)", charge: 60 }
          ]
        });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, "configs/main"));

    const unsubOffers = onSnapshot(collection(db, "offers"), (snapshot) => {
      setOffers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Offer)));
    }, (error) => handleFirestoreError(error, OperationType.GET, "offers"));

    return () => {
      unsubProducts();
      unsubCategories();
      unsubConfigs();
      unsubOffers();
    };
  }, [isAdmin, loading]);

  const updateConfig = (update: any) => {
    return updateDoc(doc(db, "configs", "main"), update);
  };

  const setScrollingMessage = (msg: string) => updateConfig({ scrollingMessage: msg });
  const setContactInfo = (info: ContactInfo) => updateConfig({ contactInfo: info });
  const setShippingSettings = (settings: ShippingSettings) => updateConfig({ shippingSettings: settings });
  const setTelegramSettings = (settings: TelegramSettings) => updateConfig({ telegramSettings: settings });
  const setSteadfastSettings = (settings: SteadfastSettings) => updateConfig({ steadfastSettings: settings });

  const sanitizeCategoryData = async (cat: Partial<Category>): Promise<Partial<Category>> => {
    const clean = { ...cat };
    if (clean.image) {
      clean.image = await sanitizeImageBase64(clean.image, { maxWidth: 800, maxHeight: 800, quality: 0.75 });
    }
    if (clean.subcategories && Array.isArray(clean.subcategories)) {
      clean.subcategories = await Promise.all(
        clean.subcategories.map(async (sub) => {
          if (sub.image) {
            const cleanSubImg = await sanitizeImageBase64(sub.image, { maxWidth: 600, maxHeight: 600, quality: 0.75 });
            return { ...sub, image: cleanSubImg };
          }
          return sub;
        })
      );
    }
    return clean;
  };

  const sanitizeProductData = async (prod: Partial<Product>): Promise<Partial<Product>> => {
    const clean = { ...prod };
    if (clean.image) {
      clean.image = await sanitizeImageBase64(clean.image, { maxWidth: 900, maxHeight: 900, quality: 0.75 });
    }
    if (clean.gallery && Array.isArray(clean.gallery)) {
      clean.gallery = await Promise.all(
        clean.gallery.map(img => sanitizeImageBase64(img, { maxWidth: 800, maxHeight: 800, quality: 0.75 }))
      );
    }
    return clean;
  };

  const addSlider = async (slider: Slider) => {
    const cleanImg = slider.image ? await sanitizeImageBase64(slider.image, { maxWidth: 1200, maxHeight: 600, quality: 0.75 }) : slider.image;
    const newSliders = [...sliders, { ...slider, image: cleanImg, id: slider.id || `slider-${Date.now()}` }];
    updateConfig({ sliders: newSliders });
  };
  const removeSlider = (id: string) => {
    updateConfig({ sliders: sliders.filter(s => s.id !== id) });
  };
  const updateSlider = async (id: string, data: Partial<Slider>) => {
    const cleanData = { ...data };
    if (cleanData.image) {
      cleanData.image = await sanitizeImageBase64(cleanData.image, { maxWidth: 1200, maxHeight: 600, quality: 0.75 });
    }
    updateConfig({ sliders: sliders.map(s => s.id === id ? { ...s, ...cleanData } : s) });
  };

  const addProduct = async (p: Product) => {
    const clean = await sanitizeProductData(p);
    return setDoc(doc(db, "products", p.id || `prod-${Date.now()}`), clean as Product);
  };
  const updateProduct = async (p: Product) => {
    const clean = await sanitizeProductData(p);
    return updateDoc(doc(db, "products", p.id), clean as any);
  };
  const removeProduct = (id: string) => deleteDoc(doc(db, "products", id));

  const addCategory = async (cat: Category) => {
    const clean = await sanitizeCategoryData(cat);
    return setDoc(doc(db, "categories", cat.id), clean as Category);
  };
  const updateCategory = async (id: string, data: Partial<Category>) => {
    const clean = await sanitizeCategoryData(data);
    return updateDoc(doc(db, "categories", id), clean as any);
  };
  const removeCategory = (id: string) => deleteDoc(doc(db, "categories", id));

  const addOffer = async (offer: Offer) => {
    const clean = { ...offer };
    if (clean.image) clean.image = await sanitizeImageBase64(clean.image, { maxWidth: 1000, maxHeight: 600, quality: 0.75 });
    return setDoc(doc(db, "offers", offer.id || `offer-${Date.now()}`), clean as Offer);
  };
  const updateOffer = async (id: string, data: Partial<Offer>) => {
    const clean = { ...data };
    if (clean.image) clean.image = await sanitizeImageBase64(clean.image, { maxWidth: 1000, maxHeight: 600, quality: 0.75 });
    return updateDoc(doc(db, "offers", id), clean as any);
  };
  const removeOffer = (id: string) => deleteDoc(doc(db, "offers", id));

  const addArea = (area: Omit<Area, 'id'>) => {
    const newAreas = [...areas, { ...area, id: `area-${Date.now()}` }];
    updateConfig({ areas: newAreas });
  };
  const updateArea = (id: string, data: Partial<Area>) => {
    updateConfig({ areas: areas.map(a => a.id === id ? { ...a, ...data } : a) });
  };
  const removeArea = (id: string) => {
    updateConfig({ areas: areas.filter(a => a.id !== id) });
  };

  return (
    <AdminContext.Provider value={{
      products, categories, offers, telegramSettings, steadfastSettings, sliders, scrollingMessage, contactInfo, areas, shippingSettings,
      setScrollingMessage, setContactInfo, addSlider, removeSlider, updateSlider, setShippingSettings, setTelegramSettings, setSteadfastSettings,
      addProduct, updateProduct, removeProduct,
      addCategory, updateCategory, removeCategory,
      addOffer, updateOffer, removeOffer,
      addArea, updateArea, removeArea
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) throw new Error('useAdmin must be used within AdminProvider');
  return context;
};
