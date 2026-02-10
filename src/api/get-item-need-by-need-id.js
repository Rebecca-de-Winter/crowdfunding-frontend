import { authFetch } from "./auth-fetch";

const API_URL = import.meta.env.VITE_API_URL;

export default async function getItemNeedByNeedId(needId) {
  const base = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
  const url = `${base}item-needs/?need=${needId}`;

  const res = await authFetch(url, { method: "GET" });

  // If authFetch throws on network issues, let it bubble.
  const data = await res.json().catch(() => null);
  if (!res.ok) return null;

  // ✅ Handle common DRF pagination: { count, next, previous, results: [...] }
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];

  if (list.length === 0) return null;

  const targetId = Number(needId);

  // ✅ Only return the row that matches this need id
  const exact = list.find((row) => Number(row?.need) === targetId);
  if (exact) return exact;

  // Fallback (better than "data[0]" but still safe)
  return null;
}
