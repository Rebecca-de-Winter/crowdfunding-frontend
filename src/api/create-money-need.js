const API_URL = import.meta.env.VITE_API_URL;

export default async function createMoneyNeed(payload) {
  const token = window.localStorage.getItem("token");

  const response = await fetch(`${API_URL}money-needs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify({
      need: payload.need,
      target_amount: payload.target_amount,
      comment: payload.comment ?? "",
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail || "Could not create money need.");
  }

  return await response.json();
}
