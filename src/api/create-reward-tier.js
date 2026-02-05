export default async function createRewardTier(fundraiserId, payload) {
  const token = window.localStorage.getItem("token");
  const url = `${import.meta.env.VITE_API_URL}reward-tiers/`;

  const bodyObj = {
    fundraiser: Number(fundraiserId),
    ...payload,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(bodyObj),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const fallbackError = "Error creating reward tier";
    throw new Error(data?.detail ?? JSON.stringify(data) ?? fallbackError);
  }

  return data;
}
