// Fill this in with your own Firebase project's config.
// Firebase console -> Project settings -> General -> "Your apps" -> Web app -> SDK setup and configuration.
import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD0reNditJGaovS-eG-tM6RaAooVwFLE5Q",
  authDomain: "inven-try.firebaseapp.com",
  projectId: "inven-try",
  storageBucket: "inven-try.firebasestorage.app",
  messagingSenderId: "132530613273",
  appId: "1:132530613273:web:b882458a3b872a99c5ce88",
};

export const app = initializeApp(firebaseConfig);

// Persistent local cache: items, suppliers and recent transactions stay
// readable (and queued writes survive a refresh) when the connection drops,
// which matters a lot for a shop that doesn't always have reliable internet.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const auth = getAuth(app);
