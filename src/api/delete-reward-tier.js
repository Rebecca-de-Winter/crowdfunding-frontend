export default async function deleteRewardTier(id) {
  const token = window.localStorage.getItem("token");
  const url = `${import.meta.env.VITE_API_URL}reward-tiers/${id}/`; // <-- adjust if needed

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Error deleting reward tier");
  }

  return true;
}
