import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDsjUt2ZCPvngO03E062Mur5jVTcfDu2BY",
  authDomain: "arabicchatbot-24bb2.firebaseapp.com",
  projectId: "arabicchatbot-24bb2",
  storageBucket: "arabicchatbot-24bb2.firebasestorage.app",
  messagingSenderId: "245689312632",
  appId: "1:245689312632:web:b67a18b2fc14803602548d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Auth
const auth = getAuth(app);

export { app, db, auth };