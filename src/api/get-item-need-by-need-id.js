import { authFetch } from "./auth-fetch";

const API_URL = import.meta.env.VITE_API_URL;

export default async function getItemNeedByNeedId(needId) {
  const base = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;

  // Adjust this path if your endpoint differs:
  // Common patterns:
  // 1) item-needs/by-need/<id>/
  // 2) item-needs/?need=<id>
  const url = `${base}item-needs/?need=${needId}`;

  const res = await authFetch(url);
  const data = await res.json().catch(() => null);

  if (!res.ok) return null;

  // If your API returns a list for the filter endpoint:
  if (Array.isArray(data)) return data[0] ?? null;

  // If it returns a single object:
  return data ?? null;
}
