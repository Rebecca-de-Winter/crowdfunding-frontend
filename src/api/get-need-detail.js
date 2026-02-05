const API_URL = import.meta.env.VITE_API_URL;

function endpointForType(type) {
  if (type === "money") return "money-needs/";
  if (type === "time") return "time-needs/";
  if (type === "item") return "item-needs/";
  throw new Error(`Unknown need type: ${type}`);
}

export default async function getNeedDetail(type, detailId) {
  const token = window.localStorage.getItem("token");

  const res = await fetch(`${API_URL}${endpointForType(type)}${detailId}/`, {
    headers: {
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail || "Could not load need detail.");
  }

  return await res.json();
}
