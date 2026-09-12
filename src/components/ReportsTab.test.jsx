import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Firestore is stubbed out so this exercises the component's own wiring: that
// it builds a query, reads the result, and renders real numbers. A crash like
// a local variable shadowing the imported query() shows up here.
const getDocs = vi.fn();
vi.mock("firebase/firestore", () => ({
  collection: (...args) => ({ __collection: args.slice(1).join("/") }),
  query: (...args) => ({ __query: args }),
  where: (...args) => ({ __where: args }),
  orderBy: (...args) => ({ __orderBy: args }),
  limit: (n) => ({ __limit: n }),
  getDocs: (...args) => getDocs(...args),
}));
vi.mock("../firebase.js", () => ({ db: {} }));

import ReportsTab from "./ReportsTab.jsx";

const asSnapshot = (rows) => ({ docs: rows.map((r, i) => ({ id: `t${i}`, data: () => r })) });

const items = [
  { id: "a", name: "Rice", qty: 3, reorderLevel: 10, costPrice: 6, unit: "bag" },
  { id: "b", name: "Oil", qty: 40, reorderLevel: 5, costPrice: 50, unit: "bottle" },
];

describe("ReportsTab", () => {
  it("renders profit figures from the movements it loads", async () => {
    getDocs.mockResolvedValue(
      asSnapshot([
        { type: "out", reason: "sale", qty: 5, unitPrice: 10, unitCost: 6, itemId: "a", itemName: "Rice", date: Date.now() },
      ])
    );

    render(<ReportsTab storeId="s1" items={items} isNarrow={false} />);

    await waitFor(() => expect(screen.getByText("GH₵50")).toBeDefined()); // revenue
    expect(screen.getByText("GH₵30")).toBeDefined(); // cost of goods sold
    expect(screen.getByText("GH₵20")).toBeDefined(); // gross profit
    expect(screen.getByText("5 units sold")).toBeDefined();
  });

  it("queries its own date-bounded slice rather than reusing the capped live feed", async () => {
    getDocs.mockResolvedValue(asSnapshot([]));
    render(<ReportsTab storeId="s1" items={items} isNarrow={false} />);

    await waitFor(() => expect(getDocs).toHaveBeenCalled());
    const built = getDocs.mock.calls.at(-1)[0].__query;
    expect(JSON.stringify(built)).toContain("__where"); // default period is bounded
    expect(JSON.stringify(built)).toContain("transactions");
  });

  it("tells the user what to do when there are no sales yet", async () => {
    getDocs.mockResolvedValue(asSnapshot([]));
    render(<ReportsTab storeId="s1" items={items} isNarrow={false} />);

    await waitFor(() => expect(screen.getByText(/Record stock-outs with reason/)).toBeDefined());
  });

  it("still flags low stock when nothing has sold", async () => {
    getDocs.mockResolvedValue(asSnapshot([]));
    render(<ReportsTab storeId="s1" items={items} isNarrow={false} />);

    // Rice is low on stock and also unsold, so it legitimately appears in two
    // sections; the shortfall label is the unique bit.
    await waitFor(() => expect(screen.getByText("3/10 bag")).toBeDefined());
    expect(screen.getAllByText("Rice").length).toBe(2);
  });

  it("surfaces a message instead of blanking when the read fails", async () => {
    // Rejects on a later tick so the component's handlers are already
    // attached, rather than creating an already-rejected promise.
    getDocs.mockImplementation(
      () => new Promise((_resolve, reject) => setTimeout(() => reject(new Error("offline")), 0))
    );
    render(<ReportsTab storeId="s1" items={items} isNarrow={false} />);

    await waitFor(() => expect(screen.getByText(/Couldn't load report data/)).toBeDefined());
  });
});
