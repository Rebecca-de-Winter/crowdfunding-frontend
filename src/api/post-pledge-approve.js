import { authFetch } from "./auth-fetch";

export default async function postPledgeApprove(pledgeId) {
  if (!pledgeId) throw new Error("postPledgeApprove: pledgeId is required");

  const base = import.meta.env.VITE_API_URL || "";
  const baseWithSlash = base.endsWith("/") ? base : `${base}/`;
  const url = `${baseWithSlash}pledges/${pledgeId}/approve/`;

  const res = await authFetch(url, { method: "POST" });

  if (!res.ok) {
    let msg = "Failed to approve pledge";
    try {
      const data = await res.json();
      msg = data?.detail || msg;
    } catch {
      // response not JSON — ignore
    }
    throw new Error(msg);
  }

  return res.json();
}
