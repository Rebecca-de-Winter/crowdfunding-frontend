const API_URL = import.meta.env.VITE_API_URL;

export default async function createTimeNeed(payload) {
  const token = window.localStorage.getItem("token");

  const response = await fetch(`${API_URL}time-needs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify({
      need: payload.need, // base need id (REQUIRED)

      start_datetime: payload.start_datetime, // ISO string (REQUIRED)
      end_datetime: payload.end_datetime,     // ISO string (REQUIRED)
      volunteers_needed: payload.volunteers_needed, // int (REQUIRED)

      role_title: payload.role_title, // REQUIRED
      location: payload.location ?? "", // CharField required in model; send "" if blank UI

      reward_tier: payload.reward_tier ?? null, // FK id or null
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail || "Could not create time need.");
  }

  return await response.json();
}
