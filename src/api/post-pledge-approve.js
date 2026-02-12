import { authFetch } from "./auth-fetch";

export default async function postPledgeApprove(pledgeId) {
  const url = `${import.meta.env.VITE_API_URL}pledges/${pledgeId}/approve/`;

  const res = await authFetch(url, { method: "POST" });

  if (!res.ok) {
    let msg = "Failed to approve pledge";
    try {
      const data = await res.json();
      msg = data?.detail || msg;
    } catch {
    throw new Error(msg);
  }

  return res.json();
}
}