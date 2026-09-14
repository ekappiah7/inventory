// Weighted average costing. Each delivery blends into a running average of
// what the stock actually on the shelf cost, so margins don't swing on when
// somebody last edited an item's cost price by hand.

// The cost to value a unit at: the blended average once there is a real one,
// otherwise the manually entered cost price. A zero average means "never
// costed" (imported without a cost column, say) rather than "genuinely free",
// so it must not mask a cost price the user has since typed in.
export function effectiveCost(item) {
  if (!item) return 0;
  const avg = Number(item.avgCost);
  if (Number.isFinite(avg) && avg > 0) return avg;
  return Number(item.costPrice) || 0;
}

// New average after receiving incomingQty units at incomingUnitCost each.
// Returns the existing average unchanged when there is nothing to blend in.
export function weightedAverageCost({ currentQty, currentAvgCost, incomingQty, incomingUnitCost }) {
  const heldQty = Math.max(0, Number(currentQty) || 0);
  const heldCost = Math.max(0, Number(currentAvgCost) || 0);
  const inQty = Math.max(0, Number(incomingQty) || 0);
  const inCost = Math.max(0, Number(incomingUnitCost) || 0);

  if (inQty === 0) return heldCost;
  // First stock in, or restocking something that ran out: the delivery sets
  // the cost outright rather than averaging against stock that isn't there.
  if (heldQty === 0) return inCost;

  const blended = (heldQty * heldCost + inQty * inCost) / (heldQty + inQty);
  // Money, so two decimals is the meaningful precision.
  return Math.round(blended * 100) / 100;
}

export function stockValue(items) {
  return items.reduce((total, item) => total + (item.qty || 0) * effectiveCost(item), 0);
}
