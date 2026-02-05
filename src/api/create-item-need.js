const API_URL = import.meta.env.VITE_API_URL;

export default async function createItemNeed(payload) {
  const token = window.localStorage.getItem("token");

  const response = await fetch(`${API_URL}item-needs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify({
      need: payload.need,
      item_name: payload.item_name,
      quantity_needed: payload.quantity_needed,
      mode: payload.mode, // "donation" | "loan" | "either"
      notes: payload.notes ?? "",
      donation_reward_tier: payload.donation_reward_tier ?? null,
      loan_reward_tier: payload.loan_reward_tier ?? null,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail || "Could not create item need.");
  }

  return await response.json();
}
