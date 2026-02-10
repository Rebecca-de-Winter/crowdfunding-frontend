import { authFetch } from "./auth-fetch";

const API_URL = import.meta.env.VITE_API_URL;

function baseUrl() {
  return API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
}

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function getNeedIdFromRow(row) {
  return Number(row?.need ?? row?.need_id);
}

export default async function getMoneyNeedByNeedId(needId) {
  const base = baseUrl();
  const targetNeedId = Number(needId);

  // 1) Try filter (if backend supports it)
  try {
    const res = await authFetch(`${base}money-needs/?need=${targetNeedId}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const list = extractList(data);

      // ✅ IMPORTANT: don't assume filter worked — find the matching row
      const match = list.find((x) => getNeedIdFromRow(x) === targetNeedId);
      if (match) return match;

      // If list exists but doesn't contain the matching row, filter isn't supported.
      // Fall through to scanning.
    }
  } catch {
    // ignore
  }

  // 2) Fallback: scan list pages and match by need id
  let nextUrl = `${base}money-needs/`;

  for (let page = 0; page < 20 && nextUrl; page++) {
    const res = await authFetch(nextUrl);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return null;

    const list = extractList(data);
    const match = list.find((x) => getNeedIdFromRow(x) === targetNeedId);
    if (match) return match;

    nextUrl = data?.next || null;
  }

  return null;
}

