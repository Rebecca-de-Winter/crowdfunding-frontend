import { authFetch } from "./auth-fetch";

export default async function postPledgeDecline(pledgeId) {
  const url = `${import.meta.env.VITE_API_URL}pledges/${pledgeId}/decline/`;

  const res = await authFetch(url, { method: "POST" });

  if (!res.ok) {
    let msg = "Failed to decline pledge";
    try {
      const data = await res.json();
      msg = data?.detail || msg;
    } catch {
    throw new Error(msg);
  }

  return res.json();
}
}