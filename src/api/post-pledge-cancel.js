import { authFetch } from "./auth-fetch";

export default async function postPledgeCancel(pledgeId) {
  const url = `${import.meta.env.VITE_API_URL}pledges/${pledgeId}/cancel/`;

  const res = await authFetch(url, { method: "POST" });

  if (!res.ok) {
    let msg = "Failed to cancel pledge";

    try {
      const data = await res.json();
      msg = data?.detail || msg;
    } catch {
      // response was not JSON — ignore
    }

    throw new Error(msg);
  }

  return res.json();
}
