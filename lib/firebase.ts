// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAspQqUW-SLcc9LWO6UX6eJ0LNzEM9-HjY",
  authDomain: "qwickshop-48a83.firebaseapp.com",
  projectId: "qwickshop-48a83",
  storageBucket: "qwickshop-48a83.firebasestorage.app",
  messagingSenderId: "972116066228",
  appId: "1:972116066228:web:934f1a7604f637feb7bce1",
  measurementId: "G-97REGB7QN0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize analytics only on client side
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export const db = getFirestore(app)
export const auth = getAuth(app)
export default app
