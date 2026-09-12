import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from "react";
import {
  collection, doc, query, orderBy, limit, onSnapshot,
  addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, increment,
} from "firebase/firestore";
import { Plus, Search, Upload } from "lucide-react";

import { db } from "./firebase.js";
import { useAuth } from "./context/AuthContext.jsx";
import { C, SANS, inputStyle } from "./utils/tokens.js";
import { itemsToCsv, downloadCsv } from "./utils/parse.js";

import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import InventoryTable from "./components/InventoryTable.jsx";
import ActivityLog from "./components/ActivityLog.jsx";
import AddItemModal from "./components/AddItemModal.jsx";
import MovementModal from "./components/MovementModal.jsx";
import SuppliersTab from "./components/SuppliersTab.jsx";
import TeamTab from "./components/TeamTab.jsx";
import ReportsTab from "./components/ReportsTab.jsx";
import { Button, ConfirmDialog } from "./components/ui.jsx";

const ImportModal = lazy(() => import("./components/ImportModal.jsx"));

export default function StockroomApp() {
  const { user, store, member, logOut } = useAuth();
  const storeId = store.id;
  const isOwner = member?.role === "owner";

  const [items, setItems] = useState(null);
  const [suppliers, setSuppliers] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [moveItem, setMoveItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { kind: 'item'|'supplier', doc }
  const [saveNote, setSaveNote] = useState("");

  useEffect(() => {
    const onError = () => setSaveNote("Couldn't reach the database — check your internet connection.");
    const unsubItems = onSnapshot(
      collection(db, "stores", storeId, "items"),
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      onError
    );
    const unsubSuppliers = onSnapshot(
      collection(db, "stores", storeId, "suppliers"),
      (snap) => setSuppliers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      onError
    );
    const unsubTx = onSnapshot(
      query(collection(db, "stores", storeId, "transactions"), orderBy("date", "desc"), limit(500)),
      (snap) => setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      onError
    );
    const unsubMembers = onSnapshot(
      collection(db, "stores", storeId, "members"),
      (snap) => setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubItems(); unsubSuppliers(); unsubTx(); unsubMembers(); };
  }, [storeId]);

  const loaded = items !== null && suppliers !== null && transactions !== null;

  const categories = useMemo(
    () => (items ? ["All", ...Array.from(new Set(items.map((i) => i.category || "General")))] : ["All"]),
    [items]
  );
  const lowStock = useMemo(() => (items || []).filter((i) => i.qty <= i.reorderLevel), [items]);
  const totalValue = useMemo(() => (items || []).reduce((s, i) => s + i.qty * (i.costPrice || 0), 0), [items]);
  const totalUnits = useMemo(() => (items || []).reduce((s, i) => s + i.qty, 0), [items]);

  const filtered = (items || []).filter((i) => {
    const matchesSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.sku || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || (i.category || "General") === category;
    return matchesSearch && matchesCat;
  });

  const whoAmI = useCallback(() => ({ byUid: user.uid, byName: member?.displayName || user.email }), [user, member]);

  const logTx = useCallback(async (tx) => {
    await addDoc(collection(db, "stores", storeId, "transactions"), { ...tx, ...whoAmI(), date: Date.now() });
  }, [storeId, whoAmI]);

  async function addItem(form) {
    try {
      const { id, ...fields } = form;
      const itemRef = await addDoc(collection(db, "stores", storeId, "items"), {
        ...fields, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      if (fields.qty > 0) {
        await logTx({
          itemId: itemRef.id, itemName: fields.name, type: "initial", qty: fields.qty, note: "Initial stock",
          unitCost: fields.costPrice || 0, unitPrice: fields.sellPrice || 0,
        });
      }
      setSaveNote("");
    } catch (e) {
      setSaveNote("Couldn't save that item — try again.");
    }
    setShowAdd(false);
  }

  async function updateItem(form) {
    try {
      const { id, ...fields } = form;
      await updateDoc(doc(db, "stores", storeId, "items", id), { ...fields, updatedAt: serverTimestamp() });
      setSaveNote("");
    } catch (e) {
      setSaveNote("Couldn't save changes — try again.");
    }
    setEditItem(null);
  }

  async function confirmDelete() {
    const { kind, doc: target } = deleteTarget;
    try {
      await deleteDoc(doc(db, "stores", storeId, kind === "item" ? "items" : "suppliers", target.id));
      setSaveNote("");
    } catch (e) {
      setSaveNote(`Couldn't delete that ${kind} — try again.`);
    }
    setDeleteTarget(null);
  }

  async function applyMovement(item, type, qty, note, reason) {
    const safeQty = type === "out" ? Math.min(qty, item.qty) : qty;
    const delta = type === "in" ? safeQty : -safeQty;
    try {
      await updateDoc(doc(db, "stores", storeId, "items", item.id), { qty: increment(delta), updatedAt: serverTimestamp() });
      await logTx({
        itemId: item.id, itemName: item.name, type, reason, qty: safeQty, note: note || "",
        unitCost: item.costPrice || 0, unitPrice: item.sellPrice || 0,
      });
      setSaveNote("");
    } catch (e) {
      setSaveNote("Couldn't record that movement — try again.");
    }
    setMoveItem(null);
  }

  async function commitImport(rows) {
    try {
      const batch = writeBatch(db);
      let totalQty = 0;
      for (const row of rows) {
        const itemRef = doc(collection(db, "stores", storeId, "items"));
        batch.set(itemRef, { ...row, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        totalQty += row.qty || 0;
      }
      const txRef = doc(collection(db, "stores", storeId, "transactions"));
      batch.set(txRef, {
        itemName: `${rows.length} item(s) imported`, type: "initial", qty: totalQty, note: "Bulk import",
        date: Date.now(), ...whoAmI(),
      });
      await batch.commit();
      setSaveNote("");
    } catch (e) {
      setSaveNote("Couldn't import that file — try again.");
    }
    setShowImport(false);
  }

  async function addSupplier(form) {
    try {
      await addDoc(collection(db, "stores", storeId, "suppliers"), { ...form, createdAt: serverTimestamp() });
    } catch (e) {
      setSaveNote("Couldn't save that supplier — try again.");
    }
  }

  async function updateSupplier(id, form) {
    try {
      await updateDoc(doc(db, "stores", storeId, "suppliers", id), form);
    } catch (e) {
      setSaveNote("Couldn't save changes — try again.");
    }
  }

  function exportInventory() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`${(store.name || "stockroom").replace(/\s+/g, "-").toLowerCase()}-inventory-${stamp}.csv`, itemsToCsv(items || []));
  }

  if (!loaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: SANS, color: C.inkSoft, background: C.bgPage }}>
        Loading stockroom…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bgPage, fontFamily: SANS }}>
      <Sidebar
        tab={tab}
        setTab={setTab}
        lowStockCount={lowStock.length}
        storeName={store.name}
        displayName={member?.displayName}
        role={member?.role}
        onSignOut={logOut}
      />

      <div style={{ flex: 1, padding: "22px 28px", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 340 }}>
            <Search size={15} style={{ position: "absolute", left: 10, top: 10, color: C.inkSoft }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items or SKU…"
              style={{ ...inputStyle, width: "100%", paddingLeft: 32, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="outline" icon={Upload} onClick={() => setShowImport(true)}>Import</Button>
            <Button variant="solid" icon={Plus} onClick={() => setShowAdd(true)}>Add item</Button>
          </div>
        </div>

        {saveNote && (
          <div style={{ background: C.rustSoft, color: C.rust, padding: "8px 12px", borderRadius: 8, fontSize: 12.5, marginBottom: 16 }}>{saveNote}</div>
        )}

        {tab === "dashboard" && (
          <Dashboard items={items} lowStock={lowStock} totalValue={totalValue} totalUnits={totalUnits} onRestock={(item) => setMoveItem({ item, type: "in" })} />
        )}
        {tab === "inventory" && (
          <InventoryTable
            items={filtered}
            categories={categories}
            category={category}
            setCategory={setCategory}
            canDelete={isOwner}
            onMove={(item, type) => setMoveItem({ item, type })}
            onEdit={setEditItem}
            onDeleteRequest={(item) => setDeleteTarget({ kind: "item", doc: item })}
            onExport={exportInventory}
          />
        )}
        {tab === "reports" && <ReportsTab items={items} transactions={transactions} />}
        {tab === "suppliers" && (
          <SuppliersTab
            suppliers={suppliers}
            items={items}
            canDelete={isOwner}
            onAdd={addSupplier}
            onUpdate={updateSupplier}
            onDeleteRequest={(supplier) => setDeleteTarget({ kind: "supplier", doc: supplier })}
          />
        )}
        {tab === "log" && <ActivityLog transactions={transactions} />}
        {tab === "team" && <TeamTab storeId={storeId} storeName={store.name} members={members} />}
      </div>

      {showAdd && <AddItemModal suppliers={suppliers} onClose={() => setShowAdd(false)} onSave={addItem} />}
      {editItem && <AddItemModal item={editItem} suppliers={suppliers} onClose={() => setEditItem(null)} onSave={updateItem} />}
      {moveItem && (
        <MovementModal item={moveItem.item} type={moveItem.type} onClose={() => setMoveItem(null)} onConfirm={(qty, note, reason) => applyMovement(moveItem.item, moveItem.type, qty, note, reason)} />
      )}
      {showImport && (
        <Suspense fallback={null}>
          <ImportModal onClose={() => setShowImport(false)} onCommit={commitImport} />
        </Suspense>
      )}
      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${deleteTarget.kind}`}
          message={
            deleteTarget.kind === "item"
              ? `Delete "${deleteTarget.doc.name}"? This removes it from inventory. Its past activity log entries stay, but nothing will link back to it.`
              : `Delete "${deleteTarget.doc.name}"? Items already using this supplier keep their supplier name, but it won't be selectable from the list anymore.`
          }
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
