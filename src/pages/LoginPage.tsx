import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, Mail, ChevronRight, AlertCircle, ShieldCheck, UserCheck, RefreshCw, Copy, Check, ExternalLink, Globe } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

export default function LoginPage() {
  const { user, isAdmin, loading, logout } = useAuth();
  const { language } = useSettings();
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  // Redirect only if authorized admin or explicit customer redirect flow
  React.useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        navigate(redirectParam || "/admin", { replace: true });
      } else if (redirectParam) {
        navigate(redirectParam, { replace: true });
      }
    }
  }, [user, isAdmin, loading, navigate, redirectParam]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    setIsUnauthorizedDomain(false);
    try {
      if (user) {
        await auth.signOut();
      }
      const provider = new GoogleAuthProvider();
      // Force account selection prompt so user can choose another Gmail
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error("Login Error Details:", err);
      if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('unauthorized-domain'))) {
        setIsUnauthorizedDomain(true);
        setError("Firebase Authorized Domain Error: এই ডোমেনটি Firebase Console এ অনুমোদিত নয়।");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const copyDomain = () => {
    if (currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setError(null);
      setIsUnauthorizedDomain(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl shadow-neutral-200/50 p-8 md:p-12 border border-neutral-100 relative overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-8">
            <div className="space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                <ShieldCheck size={32} strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-neutral-900 italic">
                {redirectParam ? "SIGN IN" : "ADMIN" } <span className="text-primary not-italic">{redirectParam ? "REQUIRED" : "PORTAL"}</span>
              </h1>
              <p className="text-sm font-medium text-neutral-500 leading-relaxed">
                {redirectParam 
                  ? (language === 'bn' ? "অর্ডার সম্পন্ন করতে দয়া করে লগইন করুন।" : "Please sign in to complete your order.")
                  : (language === 'bn' ? "অনুমোদিত এডমিন গুগল অ্যাকাউন্ট দিয়ে লগইন করুন।" : "Please sign in with your authorized Google account.")
                }
              </p>
            </div>

            {/* If user is logged in but not admin */}
            {user && !isAdmin && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-3"
              >
                <div className="flex items-center gap-2 text-amber-800 text-xs font-black uppercase tracking-wider">
                  <AlertCircle size={15} />
                  <span>লগইন অ্যাকাউন্ট এডমিন নয়</span>
                </div>
                <div className="bg-white/80 p-3 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-neutral-400">বর্তমান অ্যাকাউন্ট:</p>
                  <p className="text-xs font-mono font-bold text-neutral-900 truncate">{user.email}</p>
                </div>
                <p className="text-xs font-medium text-amber-900 leading-relaxed">
                  এই ইমেইল দিয়ে এডমিন প্যানেলে এক্সেস নেই। দয়া করে আপনার অনুমোদিত এডমিন জিমেইল দিয়ে লগইন করুন।
                </p>
                <div className="flex gap-2 pt-1">
                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <LogOut size={13} />
                    <span>লগআউট করুন</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="flex-1 py-2.5 px-3 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <RefreshCw size={13} className={isLoggingIn ? 'animate-spin' : ''} />
                    <span>অ্যাকাউন্ট বদলান</span>
                  </button>
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              {(!user || isAdmin) && (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full group relative flex items-center justify-between bg-neutral-900 hover:bg-black text-white p-5 rounded-2xl font-black transition-all active:scale-[0.98] disabled:opacity-70"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                      <LogIn size={18} />
                    </div>
                    <span className="text-sm tracking-tight">
                      {isLoggingIn ? "Signing in..." : "Login with Google"}
                    </span>
                  </div>
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              <AnimatePresence>
                {isUnauthorizedDomain && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="p-5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-300 dark:border-amber-700/50 space-y-4 text-left"
                  >
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
                      <Globe size={16} className="text-amber-600" />
                      <span>Firebase Authorized Domain সমাধান</span>
                    </div>

                    <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed font-medium">
                      আপনার নতুন ফায়ারবেস প্রজেক্ট (<span className="font-mono font-bold">vai-vai-zone01</span>) এ গুগল লগইন কাজ করার জন্য নিচের ডোমেনটি Firebase Console এ যুক্ত করতে হবে:
                    </p>

                    <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-900/50 p-2.5 rounded-xl">
                      <span className="text-[11px] font-mono font-bold text-neutral-800 dark:text-neutral-200 truncate flex-1 select-all">
                        {currentDomain}
                      </span>
                      <button
                        type="button"
                        onClick={copyDomain}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                      >
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copied ? "কপি হয়েছে!" : "কপি করুন"}</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-amber-900/80 dark:text-amber-300/80 font-medium">
                      <p className="font-bold">কীভাবে যুক্ত করবেন (৩টি সহজ ধাপ):</p>
                      <ol className="list-decimal list-inside space-y-1 pl-1">
                        <li><strong>Firebase Console</strong> এ যান &gt; <strong>Authentication</strong> &gt; <strong>Settings</strong> ট্যাবে ক্লিক করুন।</li>
                        <li><strong>Authorized domains</strong> সেকশনে <strong>Add domain</strong> এ ক্লিক করুন।</li>
                        <li>উপরের কপি করা ডোমেনটি পেস্ট করে <strong>Add</strong> চাপুন।</li>
                      </ol>
                    </div>

                    <a 
                      href="https://console.firebase.google.com/project/vai-vai-zone01/authentication/settings" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <ExternalLink size={14} />
                      <span>Firebase Settings খুলুন</span>
                    </a>
                  </motion.div>
                )}

                {error && !isUnauthorizedDomain && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-600 text-xs font-bold"
                  >
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-neutral-400">
               <div className="flex items-center gap-2">
                  <Mail size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Admin Portal</span>
               </div>
               {user && (
                 <button
                   onClick={handleLogout}
                   className="text-[11px] font-bold text-red-500 hover:text-red-700 underline flex items-center gap-1"
                 >
                   <LogOut size={12} /> লগআউট
                 </button>
               )}
            </div>
          </div>
        </motion.div>

        <p className="text-center mt-12 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-300">
          SECURED BY FIREBASE OAUTH
        </p>
      </div>
    </div>
  );
}
