export default async function createRewardTier(payload) {
  const token = window.localStorage.getItem("token");
  const url = `${import.meta.env.VITE_API_URL}reward-tiers/`; // <-- adjust if your endpoint differs

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const fallbackError = "Error creating reward tier";
    const data = await response.json().catch(() => {
      throw new Error(fallbackError);
    });
    throw new Error(data?.detail ?? fallbackError);
  }

  return response.json();
}
