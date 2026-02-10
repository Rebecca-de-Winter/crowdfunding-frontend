// src/hooks/use-need-targets.js
import { useEffect, useMemo, useState } from "react";
import getTimeNeedByNeedId from "../api/get-time-need-by-need-id";
import getItemNeedByNeedId from "../api/get-item-need-by-need-id";

function hoursBetween(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const start = new Date(startIso);
  const end = new Date(endIso);
  const ms = end - start;
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return ms / (1000 * 60 * 60);
}

/**
 * Computes "targets" from needs:
 * - timeTargetHours = sum(shiftHours * volunteers_needed)
 * - itemTargetQty   = sum(quantity_needed)
 */
export default function useNeedTargets(needs = []) {
  const [timeTargetHours, setTimeTargetHours] = useState(0);
  const [itemTargetQty, setItemTargetQty] = useState(0);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);

  const timeNeedIds = useMemo(
    () => needs.filter((n) => n.need_type === "time").map((n) => n.id).filter(Boolean),
    [needs]
  );

  const itemNeedIds = useMemo(
    () => needs.filter((n) => n.need_type === "item").map((n) => n.id).filter(Boolean),
    [needs]
  );

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setIsLoadingTargets(true);

        // --- TIME TARGET ---
        let timeTotal = 0;
        if (timeNeedIds.length) {
          const timeDetails = await Promise.all(
            timeNeedIds.map((id) => getTimeNeedByNeedId(id).catch(() => null))
          );

          for (const d of timeDetails) {
            if (!d) continue;
            const shiftHours = hoursBetween(d.start_datetime, d.end_datetime);
            const vols = Number(d.volunteers_needed ?? 1);
            const safeVols = Number.isFinite(vols) && vols > 0 ? vols : 1;

            // target = shift hours * volunteers needed
            timeTotal += shiftHours * safeVols;
          }
        }

        // --- ITEM TARGET ---
        let itemTotal = 0;
        if (itemNeedIds.length) {
          const itemDetails = await Promise.all(
            itemNeedIds.map((id) => getItemNeedByNeedId(id).catch(() => null))
          );

          for (const d of itemDetails) {
            if (!d) continue;
            const q = Number(d.quantity_needed ?? 0);
            if (Number.isFinite(q) && q > 0) itemTotal += q;
          }
        }

        if (!alive) return;
        setTimeTargetHours(timeTotal);
        setItemTargetQty(itemTotal);
      } finally {
        if (alive) setIsLoadingTargets(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [timeNeedIds, itemNeedIds]);

  return {
    timeTargetHours,
    itemTargetQty,
    isLoadingTargets,
  };
}
