// src/api/get-my-rewards-for-fundraiser.js
import { authFetch } from "./auth-fetch.js";

export default async function getMyRewardsForFundraiser(fundraiserId) {
  if (!fundraiserId) {
    throw new Error("getMyRewardsForFundraiser: fundraiserId is required");
  }

  const base = import.meta.env.VITE_API_URL || "";
  const baseWithSlash = base.endsWith("/") ? base : `${base}/`;
  const url = `${baseWithSlash}reports/fundraisers/${fundraiserId}/my-rewards/`;

  const res = await authFetch(url, { method: "GET" });

  if (!res.ok) {
    let msg = "Failed to fetch my rewards for fundraiser";
    try {
      const data = await res.json();
      msg = data?.detail || msg;
    } catch {
      // not JSON — ignore
    }
    throw new Error(msg);
  }

  return res.json();
}
