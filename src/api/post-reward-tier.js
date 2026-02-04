export default async function postRewardTier(rewardTierData) {
  const url = `${import.meta.env.VITE_API_URL}reward-tiers/`;

  const token = window.localStorage.getItem("token");
  if (!token) {
    throw new Error("You must be logged in to create a reward tier.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(rewardTierData),
  });

  if (!response.ok) {
    const fallbackError = "Error creating reward tier";
    const data = await response.json().catch(() => {
      throw new Error(fallbackError);
    });

    const errorMessage = data?.detail ?? fallbackError;
    throw new Error(errorMessage);
  }

  return await response.json();
}
