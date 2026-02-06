const API_URL = import.meta.env.VITE_API_URL;

export default async function postSignUp(payload) {
  const base = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
  const url = `${base}users/signup/`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.detail ||
      Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`).join(" | ") ||
      "Error creating account";
    throw new Error(msg);
  }
  return data;
}
