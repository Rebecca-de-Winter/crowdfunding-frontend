const API_URL = import.meta.env.VITE_API_URL;

export default async function createNeed(fundraiserId, payload) {
  const token = window.localStorage.getItem("token");

  const response = await fetch(`${API_URL}needs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify({
      fundraiser: fundraiserId,
      ...payload,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail || "Could not create need.");
  }

  return await response.json();
}
