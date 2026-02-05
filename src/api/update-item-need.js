const API_URL = import.meta.env.VITE_API_URL;

export default async function updateItemNeed(itemNeedId, payload) {
  const token = window.localStorage.getItem("token");

  const response = await fetch(`${API_URL}item-needs/${itemNeedId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail || "Could not update item need.");
  }

  return await response.json();
}
