import { authFetch } from "./auth-fetch";

/**
 * Update fundraiser (full update via PUT).
 * Your backend expects PUT.
 */
async function updateFundraiser(fundraiserId, fundraiserData) {
  const url = `${import.meta.env.VITE_API_URL}fundraisers/${fundraiserId}/`;

  const response = await authFetch(url, {
    method: "PUT",
    body: JSON.stringify(fundraiserData),
  });

  if (!response.ok) {
    const fallbackError = `Error updating fundraiser ${fundraiserId}`;
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? (data ? JSON.stringify(data) : fallbackError);
    throw new Error(message);
  }

  return await response.json();
}

export default updateFundraiser;

