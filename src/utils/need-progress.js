// src/utils/need-progress.js

export function getPledgeQty(pledge) {
  if (!pledge) return 0;

  const type = String(pledge.need_type ?? "").toLowerCase();

  // item
  if (type === "item") {
    return Number(pledge.item_detail?.quantity ?? pledge.quantity ?? 0) || 0;
  }

  // time
  if (type === "time") {
    return (
      Number(
        pledge.time_detail?.hours ??
          pledge.time_detail?.quantity ??
          pledge.time_detail?.amount ??
          pledge.hours ??
          0
      ) || 0
    );
  }

  // money
  if (type === "money") {
    return (
      Number(
        pledge.money_detail?.amount ??
          pledge.money_detail?.value ??
          pledge.money_detail?.quantity ??
          pledge.amount ??
          0
      ) || 0
    );
  }

  return 0;
}

export function summarisePledgesForNeed(pledges = [], needId) {
  let approved = 0;
  let pending = 0;
  let other = 0;

  for (const p of pledges) {
    if (Number(p.need_id) !== Number(needId)) continue;

    const qty = getPledgeQty(p);
    const s = String(p.status ?? "").toLowerCase();

    if (s === "approved") approved += qty;
    else if (s === "pending") pending += qty;
    else other += qty;
  }

  return {
    approvedQty: approved,
    pendingQty: pending,
    totalQty: approved + pending,
    otherQty: other,
  };
}

export function computeNeedProgress({
  targetQty,
  approvedQty,
  pendingQty,
  requiresApproval,
  isCancelled = false,
}) {
  const reservedQty = approvedQty + pendingQty;
  const remainingQty = Math.max(0, targetQty - reservedQty);

  const isFilled = requiresApproval
    ? approvedQty >= targetQty
    : reservedQty >= targetQty;

  let pill = { label: "Open", tone: "open" };

  if (isCancelled) pill = { label: "Cancelled", tone: "cancelled" };
  else if (isFilled) pill = { label: "Filled", tone: "filled" };
  else if (requiresApproval && pendingQty > 0)
    pill = { label: "Pending approval", tone: "pending" };

  return { remainingQty, reservedQty, isFilled, pill };
}
