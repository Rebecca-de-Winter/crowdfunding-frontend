export default async function updateRewardTier(id, payload) {
  const token = window.localStorage.getItem("token");
  const url = `${import.meta.env.VITE_API_URL}reward-tiers/${id}/`; // <-- adjust if needed

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const fallbackError = "Error updating reward tier";
    const data = await response.json().catch(() => {
      throw new Error(fallbackError);
    });
    throw new Error(data?.detail ?? fallbackError);
  }

  return response.json();
}
