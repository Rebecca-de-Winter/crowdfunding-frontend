const API_URL = import.meta.env.VITE_API_URL;

export default async function updateNeed(needId, payload) {
  const token = window.localStorage.getItem("token");

  const response = await fetch(`${API_URL}needs/${needId}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail || "Could not update need.");
  }

  return await response.json();
}
