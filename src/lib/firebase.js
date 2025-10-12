import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// --- PASTE YOUR FIREBASE CONFIGURATION HERE ---
// You can get this from your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyA-Hb2ukxIgCiq5_-7A6v3CVp7o7IRw16o",
  authDomain: "time-bank-eb831.firebaseapp.com",
  projectId: "time-bank-eb831",
  storageBucket: "time-bank-eb831.firebasestorage.app",
  messagingSenderId: "875801843411",
  appId: "1:875801843411:web:9eacf7be8c6f12c083e626"
};
// ---------------------------------------------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };