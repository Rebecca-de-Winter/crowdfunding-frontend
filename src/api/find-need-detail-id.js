// src/api/find-need-detail-id.js
const API_URL = import.meta.env.VITE_API_URL;

function endpointForType(type) {
  if (type === "money") return "money-needs/";
  if (type === "time") return "time-needs/";
  if (type === "item") return "item-needs/";
  throw new Error(`Unknown need type: ${type}`);
}

/**
 * Returns the detail row ID for a given base need id, or null if not found.
 * Handles both:
 *  - plain list responses: [{...}]
 *  - paginated responses: { results: [{...}] }
 */
export default async function findNeedDetailId(type, needId) {
  const token = window.localStorage.getItem("token");

  const res = await fetch(`${API_URL}${endpointForType(type)}?need=${needId}`, {
    headers: {
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || "Could not find need detail.");
  }

  const data = await res.json();

  const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

  // IMPORTANT: only accept a row whose FK exactly matches this needId
  const match = rows.find((r) => String(r.need) === String(needId));

  return match?.id ?? null;
}
