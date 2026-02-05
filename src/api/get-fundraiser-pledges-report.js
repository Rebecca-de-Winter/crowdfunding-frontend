import { authFetch } from "./auth-fetch.js";

export default async function getFundraiserPledgesReport(fundraiserId) {
  const url = `${import.meta.env.VITE_API_URL}reports/fundraisers/${fundraiserId}/pledges/`;

  const response = await authFetch(url, { method: "GET" });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.detail ?? "Error fetching fundraiser pledges report");
  }

  return await response.json();
}
