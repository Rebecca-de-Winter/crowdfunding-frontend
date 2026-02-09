const API_URL = import.meta.env.VITE_API_URL;

function toISOZ(datetimeLocalValue) {
  // Accepts "YYYY-MM-DDTHH:MM" (local) and returns ISO UTC like "2026-02-06T09:30:00.000Z"
  if (!datetimeLocalValue) return null;
  const d = new Date(datetimeLocalValue);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default async function createTimeNeed(payload) {
  const token = window.localStorage.getItem("token");

  // Convert to UTC ISO for DRF reliability
  const startISO = toISOZ(payload.start_datetime);
  const endISO = toISOZ(payload.end_datetime);

  if (!payload.need) throw new Error("Missing base need id (payload.need).");
  if (!startISO || !endISO) throw new Error("Start and end date/time are required.");
  if (!payload.role_title?.trim()) throw new Error("Role title is required.");

  const volunteers = Number(payload.volunteers_needed);
  if (!Number.isFinite(volunteers) || volunteers < 1) {
    throw new Error("Volunteers needed must be 1+.");
  }

  // Extra safety: end must be after start
  if (!(new Date(endISO) > new Date(startISO))) {
    throw new Error("End must be after start.");
  }

  const response = await fetch(`${API_URL}time-needs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify({
      need: payload.need, // base need id (REQUIRED)
      start_datetime: startISO, // ISO UTC string
      end_datetime: endISO, // ISO UTC string
      volunteers_needed: volunteers, // int
      role_title: payload.role_title.trim(),
      location: payload.location ?? "",
      reward_tier: payload.reward_tier ?? null,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // DRF errors are often objects; this makes your error messages nicer.
    const msg =
      data?.detail ||
      (typeof data === "object" ? JSON.stringify(data) : "Could not create time need.");
    throw new Error(msg);
  }

  return data;
}
