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

  if (typeof data === "object") {
    const parts = [];
    for (const [k, v] of Object.entries(data)) {
      if (Array.isArray(v)) {
        parts.push(`${k}: ${v.join(" ")}`);
      } else {
        parts.push(`${k}: ${String(v)}`);
      }
    }
    if (parts.length) return parts.join(" • ");
  }

  return null;
}

export default async function updateNeedDetail(type, detailId, payload) {
  const token = window.localStorage.getItem("token");

  if (!type) throw new Error("Need type is required.");
  if (!detailId) throw new Error("Detail ID is required.");

  const url = `${API_URL}${endpointForType(type)}${detailId}/`;

  // 🔹 Strip `need` field on time updates (DRF usually rejects FK changes on PUT)
  let safePayload = payload;

  if (type === "time" && payload && Object.prototype.hasOwnProperty.call(payload, "need")) {
    const { need: _unused, ...rest } = payload;
    safePayload = rest;
  }

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(safePayload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.log("updateNeedDetail failed:", {
      url,
      payload: safePayload,
      status: res.status,
      data,
    });

    const msg = formatDrfErrors(data) || "Could not update need detail.";
    throw new Error(msg);
  }

  return await res.json();
}
