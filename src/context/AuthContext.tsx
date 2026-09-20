import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, onSnapshot as onDocSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface UserSavedAddress {
  id: string | number;
  type?: string;
  name?: string;
  phone?: string;
  address: string;
  division?: string;
  district?: string;
  upazila?: string;
  customUpazila?: string;
  isDefault?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'user';
  isVerified?: boolean;
  phone?: string;
  dob?: string;
  address?: string;
  division?: string;
  district?: string;
  upazila?: string;
  addresses?: UserSavedAddress[];
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Restricted Admin Emails
const ADMIN_EMAILS = [
  'mdashik23010@gmail.com',
  'loverblack2022@gmail.com'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vvz_is_admin') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && currentUser.email) {
        const userEmail = currentUser.email.toLowerCase().trim();
        const adminFound = ADMIN_EMAILS.some(e => e.toLowerCase().trim() === userEmail);
        setIsAdmin(adminFound);
        try {
          localStorage.setItem('vvz_is_admin', adminFound ? 'true' : 'false');
        } catch {}
        
        // Listen to user profile in Firestore
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = null;
        }
        profileUnsubscribe = onDocSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          }
        }, (error) => {
          console.warn("User profile snapshot observer:", error);
        });

        // Non-blocking background sync to Firestore
        setDoc(doc(db, 'users', currentUser.uid), {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          lastLogin: serverTimestamp(),
          role: adminFound ? 'admin' : 'user'
        }, { merge: true }).catch((error) => {
          console.warn("Background user sync skipped/failed:", error);
        });
      } else {
        setIsAdmin(false);
        try {
          localStorage.removeItem('vvz_is_admin');
        } catch {}
        setUserProfile(null);
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = null;
        }
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const isAuthenticatingRef = useRef(false);

  const loginWithGoogle = async () => {
    if (isAuthenticatingRef.current) {
      console.warn("Sign-in already in progress, ignoring concurrent request.");
      return;
    }
    isAuthenticatingRef.current = true;
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const code = error?.code || '';
      const msg = error?.message || '';
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        msg.includes('cancelled-popup-request') ||
        msg.includes('Pending promise was never set')
      ) {
        console.info("Sign-in popup was closed or cancelled by user.");
        return;
      }
      console.error("Login Error:", error);
      throw error;
    } finally {
      setTimeout(() => {
        isAuthenticatingRef.current = false;
      }, 500);
    }
  };

  const logout = async () => {
    try {
      setIsAdmin(false);
      try {
        localStorage.removeItem('vvz_is_admin');
      } catch {}
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, isAdmin, loading, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
