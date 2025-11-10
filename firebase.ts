// Import the functions you need from the SDKs you need
import { Analytics, getAnalytics, isSupported } from "firebase/analytics";
import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { Functions, getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB3tHoSdU8tTQeO-_0bk-hlcdDZdnXdjhE",
  authDomain: "tfg-metafit.firebaseapp.com",
  projectId: "tfg-metafit",
  storageBucket: "tfg-metafit.firebasestorage.app",
  messagingSenderId: "642777008975",
  appId: "1:642777008975:web:ee5e0a3b2d4f549a07533a",
  measurementId: "G-634CTFTJVJ"
};

// Initialize Firebase
// Check if Firebase is already initialized to avoid re-initialization
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);

// Initialize Analytics (only for web platform)
// Analytics is not available in React Native, so we check if it's supported
let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { analytics, app };

