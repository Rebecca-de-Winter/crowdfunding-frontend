const API_URL = import.meta.env.VITE_API_URL;

export default async function deleteMoneyNeed(moneyNeedId) {
  const token = window.localStorage.getItem("token");

  const response = await fetch(`${API_URL}money-needs/${moneyNeedId}/`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail || "Could not delete money need.");
  }

  return true;
}

