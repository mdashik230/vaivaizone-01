/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, useRoutes, Link } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import BottomNav from "./components/BottomNav";
import { SettingsProvider } from "./context/SettingsContext";
import { CartProvider } from "./context/CartContext";
import { OrderProvider } from "./context/OrderContext";
import { AdminProvider } from "./context/AdminContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import { AnimatePresence } from "motion/react";
import { useAdmin } from "./context/AdminContext";
import { Lock, LogOut, LogIn, ShieldCheck } from "lucide-react";
import React, { Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";

// Lazy load secondary pages
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const SubCategoryPage = lazy(() => import("./pages/SubCategoryPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));
const AllCategoriesPage = lazy(() => import("./pages/AllCategoriesPage"));
const AllProductsPage = lazy(() => import("./pages/AllProductsPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const PaymentVerifyPage = lazy(() => import("./pages/PaymentVerifyPage"));

import { ErrorBoundary } from "./components/ErrorBoundary";

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 gap-4">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    <p className="text-xs font-bold text-neutral-400">লোড হচ্ছে...</p>
  </div>
);

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const { contactInfo } = useAdmin();
  const { user, isAdmin, logout } = useAuth();
  
  const element = useRoutes([
    { path: "/", element: <HomePage /> },
    { path: "/category/:categoryId", element: <CategoryPage /> },
    { path: "/category/:categoryId/:subCategoryName", element: <SubCategoryPage /> },
    { path: "/categories", element: <AllCategoriesPage /> },
    { path: "/products", element: <AllProductsPage /> },
    { path: "/cart", element: <CartPage /> },
    { path: "/checkout", element: <CheckoutPage /> },
    { path: "/payment-verify", element: <PaymentVerifyPage /> },
    { path: "/payment-verify/:orderId", element: <PaymentVerifyPage /> },
    { path: "/product/:productId", element: <ProductDetailsPage /> },
    { path: "/profile", element: <ProfilePage /> },
    { path: "/contact", element: <ContactPage /> },
    { path: "/about", element: <AboutPage /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/admin", element: <ProtectedAdminRoute><AdminPage /></ProtectedAdminRoute> },
  ]);

  if (!element) return null;

  // App Lock / Maintenance Mode
  if (contactInfo?.isAppLocked && !isAdmin && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/login')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 p-8 text-center">
        <div className="max-w-md w-full space-y-6">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Lock size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black italic tracking-tighter text-neutral-900 dark:text-white">WE'LL BE BACK SOON</h1>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">App is under maintenance</p>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 font-medium text-sm leading-relaxed">
            আমরা অ্যাপটি আপডেট করছি। কিছুক্ষণের মধ্যেই আবার ফিরে আসবো। আমাদের সাথেই থাকুন।
          </p>

          {user ? (
            <div className="p-5 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="space-y-1 text-center">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">বর্তমানে লগইন আছেন</p>
                <p className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 truncate">{user.email}</p>
                <span className="inline-block px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-bold rounded-md uppercase">
                  সাধারন ইউজার (Non-Admin)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-colors border border-red-200 dark:border-red-900/50"
                >
                  <LogOut size={15} />
                  <span>লগআউট করুন</span>
                </button>
                <Link
                  to="/login"
                  className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 transition-transform active:scale-95"
                >
                  <LogIn size={15} />
                  <span>এডমিন লগইন</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 bg-primary hover:bg-primary/90 text-white font-black text-sm rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShieldCheck size={18} />
                <span>এডমিন লগইন (Admin Login)</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        {React.cloneElement(element as React.ReactElement, { key: location.pathname })}
      </AnimatePresence>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AdminProvider>
            <SettingsProvider>
              <CartProvider>
                <OrderProvider>
                  <ScrollToTop />
                  <AnimatedRoutes />
                  <BottomNav />
                  <FloatingWhatsApp />
                </OrderProvider>
              </CartProvider>
            </SettingsProvider>
          </AdminProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
