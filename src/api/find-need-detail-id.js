// src/api/find-need-detail-id.js
import { authFetch } from "./auth-fetch";

const API_URL = import.meta.env.VITE_API_URL;

function baseUrl() {
  return API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
}

function endpointForType(type) {
  if (type === "money") return "money-needs/";
  if (type === "time") return "time-needs/";
  if (type === "item") return "item-needs/";
  throw new Error(`Unknown need type: ${type}`);
}

function extractRows(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function matchNeedFk(row, needId) {
  // some APIs return need as number, some as string, some as need_id
  const fk = row?.need ?? row?.need_id;
  return String(fk) === String(needId);
}

async function fetchJson(url) {
  const res = await authFetch(url, { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || "Could not find need detail.");
  return data;
}

/**
 * Returns the detail row ID for a given base need id, or null if not found.
 * Works even if the backend does NOT support filtering by ?need=
 */
export default async function findNeedDetailId(type, needId) {
  const base = baseUrl();
  const endpoint = endpointForType(type);

  // 1) Try filter first (fast path if backend supports it)
  try {
    const filtered = await fetchJson(
      `${base}${endpoint}?need=${encodeURIComponent(needId)}`
    );
    const rows = extractRows(filtered);
    const match = rows.find((r) => matchNeedFk(r, needId));
    if (match?.id) return match.id;
  } catch {
    // ignore and fallback
  }

  // 2) Fallback: scan list pages and find the matching FK
  // Bounded so it won’t loop forever.
  let nextUrl = `${base}${endpoint}`;
  for (let page = 0; page < 10 && nextUrl; page++) {
    const data = await fetchJson(nextUrl);
    const rows = extractRows(data);
    const match = rows.find((r) => matchNeedFk(r, needId));
    if (match?.id) return match.id;

    nextUrl = data?.next || null; // DRF pagination
  }

  return null;
}
