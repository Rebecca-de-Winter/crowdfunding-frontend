const API_URL = import.meta.env.VITE_API_URL;

export default async function deleteItemNeed(itemNeedId) {
  const token = window.localStorage.getItem("token");

  const response = await fetch(`${API_URL}item-needs/${itemNeedId}/`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail || "Could not delete item need.");
  }

  return true;
}

