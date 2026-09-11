import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, collection, setDoc, getDoc, onSnapshot, serverTimestamp, writeBatch } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import { seedItems } from "../utils/parse.js";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = not checked yet, null = signed out
  const [profile, setProfile] = useState(null); // users/{uid} doc: { storeId, displayName, email }
  const [store, setStore] = useState(null); // stores/{storeId} doc
  const [member, setMember] = useState(null); // stores/{storeId}/members/{uid} doc: { role, displayName }
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u || null)), []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setStore(null);
      setMember(null);
      setProfileLoaded(user === null);
      return;
    }
    setProfileLoaded(false);
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      setProfile(snap.exists() ? snap.data() : null);
      setProfileLoaded(true);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user || !profile?.storeId) {
      setStore(null);
      setMember(null);
      return;
    }
    const unsubStore = onSnapshot(doc(db, "stores", profile.storeId), (snap) => {
      setStore(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    const unsubMember = onSnapshot(doc(db, "stores", profile.storeId, "members", user.uid), (snap) => {
      setMember(snap.exists() ? snap.data() : null);
    });
    return () => {
      unsubStore();
      unsubMember();
    };
  }, [user, profile?.storeId]);

  const signUp = useCallback(async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName) await updateProfile(cred.user, { displayName });
    return cred.user;
  }, []);

  const logIn = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return cred.user;
  }, []);

  const logOut = useCallback(() => signOut(auth), []);

  const createStore = useCallback(async (storeName, displayName) => {
    const u = auth.currentUser;
    if (!u) throw new Error("Not signed in.");
    const storeRef = doc(collection(db, "stores"));
    await setDoc(storeRef, { name: storeName.trim(), ownerUid: u.uid, createdAt: serverTimestamp() });
    await setDoc(doc(db, "stores", storeRef.id, "members", u.uid), {
      role: "owner",
      displayName: displayName.trim(),
      email: u.email,
      joinedAt: serverTimestamp(),
    });
    await setDoc(doc(db, "users", u.uid), { storeId: storeRef.id, displayName: displayName.trim(), email: u.email });

    // Seed a few example items so a brand-new shop isn't a blank screen.
    const batch = writeBatch(db);
    for (const item of seedItems()) {
      const itemRef = doc(collection(db, "stores", storeRef.id, "items"));
      batch.set(itemRef, { ...item, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    await batch.commit().catch(() => {}); // non-critical; ignore if it fails

    return storeRef.id;
  }, []);

  const joinStore = useCallback(async (storeId, displayName) => {
    const u = auth.currentUser;
    if (!u) throw new Error("Not signed in.");
    const trimmedId = storeId.trim();
    const storeSnap = await getDoc(doc(db, "stores", trimmedId));
    if (!storeSnap.exists()) {
      throw new Error("No store found with that ID. Double-check it with your shop owner.");
    }
    await setDoc(doc(db, "stores", trimmedId, "members", u.uid), {
      role: "staff",
      displayName: displayName.trim(),
      email: u.email,
      joinedAt: serverTimestamp(),
    });
    await setDoc(doc(db, "users", u.uid), { storeId: trimmedId, displayName: displayName.trim(), email: u.email });
    return trimmedId;
  }, []);

  const value = {
    user,
    authChecked: user !== undefined,
    profile,
    profileLoaded,
    store,
    member,
    needsStoreSetup: profileLoaded && user && (!profile || !profile.storeId),
    signUp,
    logIn,
    logOut,
    createStore,
    joinStore,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
