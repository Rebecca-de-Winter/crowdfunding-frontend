// src/api/get-time-need-by-need-id.js
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

function matchesNeed(row, needId) {
  const rowNeed = Number(row?.need ?? row?.need_id);
  return Number.isFinite(rowNeed) && rowNeed === Number(needId);
}

export default async function getTimeNeedByNeedId(needId) {
  if (!needId) return null;

  const base = baseUrl();

  // 1) Try filter (if backend supports it)
  try {
    const res = await authFetch(`${base}time-needs/?need=${encodeURIComponent(needId)}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const list = extractList(data);

      // ✅ Only return if it truly matches (prevents "always list[0]" bug)
      const match = list.find((row) => matchesNeed(row, needId));
      if (match) return match;
    }
  } catch {
    // ignore
  }

  // 2) Fallback: scan list pages and match by need id
  let nextUrl = `${base}time-needs/`;
  for (let page = 0; page < 10 && nextUrl; page++) {
    const res = await authFetch(nextUrl);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return null;

    const list = extractList(data);
    const match = list.find((row) => matchesNeed(row, needId));
    if (match) return match;

    nextUrl = data?.next || null;
  }

  return null;
}
