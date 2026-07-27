
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCaqL1vezTweex1Nous13RVCT-SboWahgA",
  authDomain: "gen-lang-client-0774434898.firebaseapp.com",
  projectId: "gen-lang-client-0774434898",
  storageBucket: "gen-lang-client-0774434898.firebasestorage.app",
  messagingSenderId: "118372529010",
  appId: "1:118372529010:web:11232165f5819d4255e3eb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID
export const db = getFirestore(app, "stigenai");
