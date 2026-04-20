// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9Tlkzqm6cc3e0RyL7MVvl3VW-BRUyYgM",
  authDomain: "e-park-25aa8.firebaseapp.com",
  projectId: "e-park-25aa8",
  storageBucket: "e-park-25aa8.firebasestorage.app",
  messagingSenderId: "326233393944",
  appId: "1:326233393944:web:09f6c7d896c967ccb0ac6d",
  measurementId: "G-XSW3Z41VJY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth & Storage
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

export { app };
export { auth };
export { storage };
export { db };
