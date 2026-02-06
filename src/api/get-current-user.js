import { authFetch } from "./auth-fetch";

const API_URL = import.meta.env.VITE_API_URL;

export default async function getCurrentUser() {
  const base = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
  const res = await authFetch(`${base}users/me/`);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || "Not authenticated");
  return data;
}
