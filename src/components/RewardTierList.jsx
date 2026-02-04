import { useMemo } from "react";
import RewardTierCard from "./RewardTierCard";
import "./RewardTierList.css";

export default function RewardTierList({
  tiers = [],
  disabled = false,
  onDeleteTier,
  onUpdateTier,
}) {
  const sorted = useMemo(() => {
    return [...tiers].sort((a, b) => {
      const sa = a.sort_order ?? 9999;
      const sb = b.sort_order ?? 9999;
      if (sa !== sb) return sa - sb;
      return (a.id ?? 0) - (b.id ?? 0);
    });
  }, [tiers]);

  if (sorted.length === 0) {
    return <p className="rewardList__empty">No reward tiers yet.</p>;
  }

  return (
    <div className="rewardTiles">
      {sorted.map((tier) => (
        <RewardTierCard
          key={tier.id}
          tier={tier}
          disabled={disabled}
          onDelete={onDeleteTier}
          onUpdate={onUpdateTier}
        />
      ))}
    </div>
  );
}
