const API_URL = import.meta.env.VITE_API_URL;

function endpointForType(type) {
  if (type === "money") return "money-needs/";
  if (type === "time") return "time-needs/";
  if (type === "item") return "item-needs/";
  throw new Error(`Unknown need type: ${type}`);
}

function formatDrfErrors(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;

  // field errors: {field: ["msg", ...], ...}
  if (typeof data === "object") {
    const parts = [];
    for (const [k, v] of Object.entries(data)) {
      if (Array.isArray(v)) parts.push(`${k}: ${v.join(" ")}`);
      else parts.push(`${k}: ${String(v)}`);
    }
    if (parts.length) return parts.join(" • ");
  }
  return null;
}

export default async function updateNeedDetail(type, detailId, payload) {
  const token = window.localStorage.getItem("token");

  const url = `${API_URL}${endpointForType(type)}${detailId}/`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.log("updateNeedDetail failed:", { url, payload, status: res.status, data });

    const msg = formatDrfErrors(data) || "Could not update need detail.";
    throw new Error(msg);
  }

  return await res.json();
}
