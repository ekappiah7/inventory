import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, collection, setDoc, getDoc, deleteDoc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import { generateInviteCode, normalizeInviteCode } from "../utils/invite.js";

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
  const [memberLoaded, setMemberLoaded] = useState(false);

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
      setMemberLoaded(false);
      return;
    }
    setMemberLoaded(false);
    const unsubStore = onSnapshot(
      doc(db, "stores", profile.storeId),
      (snap) => setStore(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      () => setStore(null) // unreadable once membership is gone
    );
    // Membership is what actually grants access, so its absence (rather than
    // "still loading") is what tells the app access was revoked.
    const unsubMember = onSnapshot(
      doc(db, "stores", profile.storeId, "members", user.uid),
      (snap) => {
        setMember(snap.exists() ? snap.data() : null);
        setMemberLoaded(true);
      },
      () => {
        setMember(null);
        setMemberLoaded(true);
      }
    );
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

  const signInWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    return cred.user;
  }, []);

  const logOut = useCallback(() => signOut(auth), []);

  const createStore = useCallback(async (storeName, displayName) => {
    const u = auth.currentUser;
    if (!u) throw new Error("Not signed in.");
    const storeRef = doc(collection(db, "stores"));
    const code = generateInviteCode();

    await setDoc(storeRef, {
      name: storeName.trim(),
      ownerUid: u.uid,
      inviteCode: code,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, "invites", code), {
      storeId: storeRef.id,
      createdBy: u.uid,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, "stores", storeRef.id, "members", u.uid), {
      role: "owner",
      displayName: displayName.trim(),
      email: u.email,
      joinedAt: serverTimestamp(),
    });
    await setDoc(doc(db, "users", u.uid), { storeId: storeRef.id, displayName: displayName.trim(), email: u.email });

    return storeRef.id;
  }, []);

  const joinStore = useCallback(async (inviteCode, displayName) => {
    const u = auth.currentUser;
    if (!u) throw new Error("Not signed in.");
    const code = normalizeInviteCode(inviteCode);
    const inviteSnap = await getDoc(doc(db, "invites", code));
    if (!inviteSnap.exists()) {
      throw new Error("That invite code isn't valid. It may have been replaced, so ask your shop owner for the current one.");
    }
    const { storeId } = inviteSnap.data();
    await setDoc(doc(db, "stores", storeId, "members", u.uid), {
      role: "staff",
      displayName: displayName.trim(),
      email: u.email,
      inviteCode: code,
      joinedAt: serverTimestamp(),
    });
    await setDoc(doc(db, "users", u.uid), { storeId, displayName: displayName.trim(), email: u.email });
    return storeId;
  }, []);

  // Mints a fresh code and revokes the old one, so a leaked code stops working.
  const regenerateInvite = useCallback(async (storeId, currentCode) => {
    const u = auth.currentUser;
    if (!u) throw new Error("Not signed in.");
    const code = generateInviteCode();
    await setDoc(doc(db, "invites", code), { storeId, createdBy: u.uid, createdAt: serverTimestamp() });
    await updateDoc(doc(db, "stores", storeId), { inviteCode: code });
    if (currentCode && currentCode !== code) {
      await deleteDoc(doc(db, "invites", currentCode)).catch(() => {});
    }
    return code;
  }, []);

  const removeMember = useCallback(async (storeId, uid) => {
    await deleteDoc(doc(db, "stores", storeId, "members", uid));
  }, []);

  // Lets someone whose access was removed detach from the shop and join
  // another one, instead of being stuck on a dead screen.
  const leaveStore = useCallback(async () => {
    const u = auth.currentUser;
    if (!u) return;
    await setDoc(doc(db, "users", u.uid), { storeId: null, displayName: u.displayName || "", email: u.email });
  }, []);

  const value = {
    user,
    authChecked: user !== undefined,
    profile,
    profileLoaded,
    store,
    member,
    memberLoaded,
    needsStoreSetup: profileLoaded && user && (!profile || !profile.storeId),
    signUp,
    logIn,
    signInWithGoogle,
    logOut,
    createStore,
    joinStore,
    regenerateInvite,
    removeMember,
    leaveStore,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
