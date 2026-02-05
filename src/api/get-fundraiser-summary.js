import { authFetch } from "./auth-fetch.js";

export default async function getFundraiserSummary(fundraiserId) {
  const url = `${import.meta.env.VITE_API_URL}reports/fundraisers/${fundraiserId}/summary/`;

  const response = await authFetch(url, { method: "GET" });

  if (!response.ok) {
    const fallbackError = "Error fetching fundraiser summary";
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(fallbackError);
    }
    throw new Error(data?.detail ?? fallbackError);
  }

  return response.json();
}
