import { authFetch } from "./auth-fetch";

async function postFundraiser(
  title,
  description,
  goal,
  image_url,
  location,
  start_date,
  end_date,
  status,
  enable_rewards,
  sort_order
) {
  const url = `${import.meta.env.VITE_API_URL}fundraisers/`;

  const response = await authFetch(url, {
    method: "POST",
    body: JSON.stringify({
      title,
      description,
      goal,
      image_url,
      location,
      start_date,
      end_date,
      status,
      enable_rewards,
      sort_order,
    }),
  });

  if (!response.ok) {
    const fallbackError = "Error creating fundraiser";

    // Try to parse error body from DRF
    const data = await response.json().catch(() => null);

    // DRF might return:
    // - { detail: "..." }
    // - OR field errors like { goal: ["..."], title: ["..."] }
    const message = data?.detail ?? (data ? JSON.stringify(data) : fallbackError);

    throw new Error(message);
  }

  return await response.json();
}

export default postFundraiser;
