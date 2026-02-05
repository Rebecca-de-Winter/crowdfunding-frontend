const API_URL = import.meta.env.VITE_API_URL;

function formatDrfErrors(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;

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

export default async function updateNeed(needId, payload) {
  const token = window.localStorage.getItem("token");
  const url = `${API_URL}needs/${needId}/`;

  // ✅ LOG what you're actually sending
  console.log("UPDATE NEED →", { url, needId, payload });

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  // ✅ LOG what the server actually returns
  console.log("UPDATE NEED ←", { url, status: res.status, data });

  if (!res.ok) {
    const msg = formatDrfErrors(data) || "Could not update need.";
    throw new Error(msg);
  }

  return data;
}
