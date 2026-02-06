import { authFetch } from "./auth-fetch";

async function getFundraiser(fundraiserId) {
  const base = import.meta.env.VITE_API_URL.endsWith("/")
    ? import.meta.env.VITE_API_URL
    : `${import.meta.env.VITE_API_URL}/`;

  const url = `${base}fundraisers/${fundraiserId}/`;

  const response = await authFetch(url, { method: "GET" });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fallbackError = `Error fetching fundraiser with id ${fundraiserId}`;
    const errorMessage = data?.detail ?? fallbackError;
    throw new Error(errorMessage);
  }

  return data;
}

export default getFundraiser;
