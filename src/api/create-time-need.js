// src/api/create-time-need.js
const API_URL = import.meta.env.VITE_API_URL;

function toUtcIsoFromLocalInput(dtLocal) {
  // dtLocal is from <input type="datetime-local"> like "YYYY-MM-DDTHH:mm"
  if (!dtLocal) return null;

  const s = String(dtLocal).trim();

  // accept "YYYY-MM-DDTHH:mm" or "...:ss"
  const withSeconds =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) ? `${s}:00` : s;

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(withSeconds)) return null;

  const d = new Date(withSeconds); // interpreted as LOCAL time
  if (Number.isNaN(d.getTime())) return null;

  return d.toISOString(); // UTC Z
}

export default async function createTimeNeed(payload) {
  const token = window.localStorage.getItem("token");

  if (!payload.need) throw new Error("Missing base need id (payload.need).");
  if (!payload.role_title?.trim()) throw new Error("Role title is required.");

  const startIso = toUtcIsoFromLocalInput(payload.start_datetime);
  const endIso = toUtcIsoFromLocalInput(payload.end_datetime);
  if (!startIso || !endIso) throw new Error("Start and end date/time are required.");

  const volunteers = Number(payload.volunteers_needed);
  if (!Number.isFinite(volunteers) || volunteers < 1) {
    throw new Error("Volunteers needed must be 1+.");
  }

  if (new Date(endIso) <= new Date(startIso)) throw new Error("End must be after start.");

  const res = await fetch(`${API_URL}time-needs/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify({
      need: payload.need,
      start_datetime: startIso,
      end_datetime: endIso,
      volunteers_needed: volunteers,
      role_title: payload.role_title.trim(),
      location: payload.location ?? "",
      reward_tier: payload.reward_tier ?? null,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.detail || (typeof data === "object" ? JSON.stringify(data) : "Could not create time need.");
    throw new Error(msg);
  }
  return data;
}
