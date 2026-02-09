import { authFetch } from "./auth-fetch";

const API_URL = import.meta.env.VITE_API_URL;

export default async function deleteFundraiser(fundraiserId) {
  const base = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
  const res = await authFetch(`${base}fundraisers/${fundraiserId}/`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      data?.detail ||
        data?.non_field_errors?.[0] ||
        "Could not delete festival."
    );
  }

  // Usually 204 No Content
  return true;
}
