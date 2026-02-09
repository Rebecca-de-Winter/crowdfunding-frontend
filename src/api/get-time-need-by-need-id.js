import { authFetch } from "./auth-fetch";

const API_URL = import.meta.env.VITE_API_URL;

export default async function getTimeNeedByNeedId(needId) {
  const base = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;

  // Try filtered list endpoint: /time-needs/?need=<id>
  const res = await authFetch(`${base}time-needs/?need=${needId}`);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || "Error fetching time need");

  // DRF list might return an array OR paginated {results:[...]}
  const list = Array.isArray(data) ? data : data?.results;

  // If filtering works, there should be exactly one
  if (Array.isArray(list) && list.length > 0) return list[0];

  // If filtering doesn't work or nothing found
  return null;
}
