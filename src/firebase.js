import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDXXpqgihnOoZd1sxP_zYUxI3A7em_v_cw",
  authDomain: "family-album-952bf.firebaseapp.com",
  projectId: "family-album-952bf",
  storageBucket: "family-album-952bf.firebasestorage.app",
  messagingSenderId: "249829477829",
  appId: "1:249829477829:web:bb571062e4e5f6b0980fac"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);