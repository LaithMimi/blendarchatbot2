// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import Cookies from "js-cookie";
import { app } from "../config/firebaseConfig";

interface AuthContextType {
  currentUser: string | null;
  email: string;
  userName: string;
  authToken: string | null;
  isAuthenticated: boolean;
  setEmail: (email: string) => void;
  setUserName: (name: string) => void;
  setIsAuthenticated: (auth: boolean) => void;
  sendEmailLink: (email: string) => Promise<boolean>;
  completeEmailSignIn: (email: string) => Promise<boolean>;
  googleSignIn: () => Promise<boolean>;
  logout: () => Promise<void>;
  devLogin: () => Promise<boolean>;
  emailLinkSent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Example email link settings
const actionCodeSettings = {
  url: window.location.origin + '/auth/complete',
  handleCodeInApp: true
};

// Helpers for session/cookie storage
const setSessionItem = (key: string, value: string): void => {
  try {
    sessionStorage.setItem(key, value);
  } catch {}
};
const getSessionItem = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
const removeSessionItem = (key: string): void => {
  try {
    sessionStorage.removeItem(key);
  } catch {}
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useMemo(() => getAuth(app), []);
  const firestore = useMemo(() => getFirestore(app), []);
  const provider = useMemo(() => new GoogleAuthProvider(), []);

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check if incoming URL is an email sign-in link
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let storedEmail = localStorage.getItem('emailForSignIn');
      if (storedEmail) {
        completeEmailSignIn(storedEmail);
      } else {
        console.log("Email not found in storage; user must input it manually.");
      }
    }
  }, [auth]);

  // Observe auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken(true);
          setAuthToken(token);
          setUserId(user.uid);

          // Attempt to use user.displayName if no userName is stored
          if (!userName && user.displayName) {
            setUserName(user.displayName);
          }

          setCurrentUser(user.displayName || user.email || null);
          setIsAuthenticated(true);

          Cookies.set("authToken", token, { secure: true, sameSite: "strict" });
          setSessionItem("authToken", token);

          // Create or update user in Firestore
          const userRef = doc(firestore, "users", user.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            // brand new user doc
            await setDoc(userRef, {
              userId: user.uid,
              email: user.email || "",
              userName: user.displayName || user.email || "New User",
              createdAt: new Date().toISOString(),
              isPremium: false,
              totalMessages: {}
            });
          } else {
            // partial update
            await updateDoc(userRef, {
              userName: user.displayName || user.email || "UpdatedUser",
              updatedAt: new Date().toISOString()
            });
          }

        } catch (error) {
          console.error("Error in onAuthStateChanged:", error);
        }
      } else {
        // Signed out
        resetAuthState();
      }
    });
    return () => unsubscribe();
  }, [auth, firestore, userName]);

  const resetAuthState = () => {
    setCurrentUser(null);
    setEmail("");
    setUserName("");
    setIsAuthenticated(false);
    setAuthToken(null);
    setDevMode(false);
    setEmailLinkSent(false);
    setUserId(null);

    Cookies.remove("authToken");
    removeSessionItem("authToken");
  };

  // Email link sign-in
  const sendEmailLink = async (email: string) => {
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      localStorage.setItem('emailForSignIn', email);
      setEmail(email);
      setEmailLinkSent(true);
      return true;
    } catch (error) {
      console.error("Failed to send email sign-in link:", error);
      return false;
    }
  };

  const completeEmailSignIn = async (email: string) => {
    try {
      await signInWithEmailLink(auth, email, window.location.href);
      localStorage.removeItem('emailForSignIn');
      setEmailLinkSent(false);
      return true;
    } catch (error) {
      console.error("Failed to complete email sign-in:", error);
      return false;
    }
  };

  // Google sign-in
  const googleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      return true;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      return false;
    }
  };

  // Dev mode login
  const devLogin = async () => {
    const devUserId = "dev_" + Date.now().toString();
    const devUserName = "Developer Mode User";

    setCurrentUser(devUserName);
    setUserName(devUserName);
    setIsAuthenticated(true);
    setAuthToken("dev_token_for_testing");
    setDevMode(true);
    setUserId(devUserId);

    Cookies.set("authToken", "dev_token_for_testing", { secure: true, sameSite: "strict" });
    setSessionItem("authToken", "dev_token_for_testing");

    // Optionally create a dev user doc in Firestore
    try {
      const devUserRef = doc(firestore, "users", devUserId);
      await setDoc(devUserRef, {
        userId: devUserId,
        userName: devUserName,
        email: "dev@example.com",
        authProvider: "dev_mode",
        createdAt: new Date().toISOString(),
        isPremium: true
      });
    } catch (error) {
      console.error("Error creating dev user in Firestore:", error);
    }

    console.log("🛠️ Developer mode sign-in successful");
    return true;
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      resetAuthState();
    } catch (error) {
      console.error("Logout Error:", error);
      resetAuthState();
    }
  };

  const contextValue = {
    currentUser,
    email,
    userName,
    authToken,
    isAuthenticated,
    setEmail,
    setUserName,
    setIsAuthenticated,
    sendEmailLink,
    completeEmailSignIn,
    googleSignIn,
    logout,
    devLogin,
    emailLinkSent
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
