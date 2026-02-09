const API_URL = import.meta.env.VITE_API_URL;

function prettifyDRFError(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;

  // Common DRF pattern: { field: ["msg"] }
  if (typeof data === "object") {
    try {
      const firstKey = Object.keys(data)[0];
      const val = data[firstKey];
      if (Array.isArray(val) && val[0]) return `${firstKey}: ${val[0]}`;
      return JSON.stringify(data);
    } catch {
      return null;
    }
  }

  return null;
}

export default async function createNeed(fundraiserId, payload) {
  const token = window.localStorage.getItem("token");

  const fundraiser = Number(fundraiserId);
  if (!Number.isFinite(fundraiser)) {
    throw new Error("Invalid fundraiser id.");
  }

  const body = {
    fundraiser,
    ...payload,
  };

  // Optional niceties (won’t hurt anything)
  if (typeof body.title === "string") body.title = body.title.trim();
  if (typeof body.description === "string") body.description = body.description.trim();

  const response = await fetch(`${API_URL}needs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(prettifyDRFError(data) || "Could not create need.");
  }

  return data;
}
