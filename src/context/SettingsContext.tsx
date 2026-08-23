import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "bn" | "en";
type Theme = "light" | "dark";

interface SettingsContextType {
  language: Language;
  theme: Theme;
  notifications: boolean;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  setNotifications: (status: boolean) => void;
  t: (key: string) => string;
}

const translations = {
  bn: {
    profile: "আমার প্রোফাইল",
    orders: "আমার অর্ডার",
    address: "ডেলিভারি ঠিকানা",
    wishlist: "উইশলিস্ট",
    settings: "সেটিংস",
    logout: "লগ আউট",
    edit_profile: "প্রোফাইল এডিট",
    save_changes: "পরিবর্তন সেভ করুন",
    cancel: "বাতিল",
    notifications: "নোটিফিকেশন",
    language: "ল্যাঙ্গুয়েজ / ভাষা",
    dark_mode: "ডার্ক মোড",
    verification: "একাউন্ট ভেরিফিকেশন",
    back_to_profile: "প্রোফাইল মেনু",
    back_to_page: "আগের পেজে ফিরে যান",
    home: "হোম",
    categories: "ক্যাটাগরি",
    offers: "অফারসমূহ",
    contact: "যোগাযোগ",
    search_placeholder: "পণ্য খুঁজুন...",
    cart: "কার্ট",
    membership_title: "প্রিমিয়াম মেম্বারশিপ",
    membership_desc: "সব কেনাকাটায় পান স্পেশাল ডিসকাউন্ট!",
    join_now: "এখনই জয়েন করুন",
    all_rights: "সকল অধিকার সংরক্ষিত",
    view_all: "সবগুলো দেখুন",
    back_to_menu: "মেনু তে ফিরুন",
    no_results: "কোনো পণ্য পাওয়া যায়নি",
    searching: "খোঁজা হচ্ছে...",
    add_to_cart: "কার্টে যোগ করুন",
    buy_now: "এখনই কিনুন",
    select_size: "সাইজ নির্বাচন করুন",
    select_color: "কালার নির্বাচন করুন",
    quantity: "পরিমাণ",
    pieces: "পিস",
    weight: "ওজন",
    kg: "কেজি",
    gram: "গ্রাম",
    product_description: "পণ্য বিবরণ",
    related_products: "একই ধরণের পণ্য",
  },
  en: {
    profile: "My Profile",
    orders: "My Orders",
    address: "Delivery Address",
    wishlist: "Wishlist",
    settings: "Settings",
    logout: "Log Out",
    edit_profile: "Edit Profile",
    save_changes: "Save Changes",
    cancel: "Cancel",
    notifications: "Notifications",
    language: "Language / ভাষা",
    dark_mode: "Dark Mode",
    verification: "Account Verification",
    back_to_profile: "Profile Menu",
    back_to_page: "Go Back",
    home: "Home",
    categories: "Categories",
    offers: "Offers",
    contact: "Contact",
    search_placeholder: "Search products...",
    cart: "Cart",
    membership_title: "Premium Membership",
    membership_desc: "Get special discounts on all purchases!",
    join_now: "Join Now",
    all_rights: "All rights reserved",
    view_all: "View All",
    back_to_menu: "Back to Menu",
    no_results: "No products found",
    searching: "Searching...",
    add_to_cart: "Add to Cart",
    buy_now: "Buy Now",
    select_size: "Select Size",
    select_color: "Select Color",
    quantity: "Quantity",
    pieces: "Pieces",
    weight: "Weight",
    kg: "KG",
    gram: "Gram",
    product_description: "Product Description",
    related_products: "Related Products",
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("lang") as Language) || "bn");
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "light");
  const [notifications, setNotifications] = useState(() => localStorage.getItem("notifications") === "true");

  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("notifications", String(notifications));
  }, [notifications]);

  const t = (key: string) => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <SettingsContext.Provider value={{ language, theme, notifications, setLanguage, setTheme, setNotifications, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
