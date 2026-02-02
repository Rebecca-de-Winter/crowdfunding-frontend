import { authFetch } from "./auth-fetch";

/**
 * Must be POST.
 * Backend expects:
 * { fundraiser_id: <id>, template_id: <id> }
 */
export async function applyTemplate(fundraiserId, templateId) {
  const url = `${import.meta.env.VITE_API_URL}fundraisers/apply-template/`;

  const response = await authFetch(url, {
    method: "POST", 
    body: JSON.stringify({
      fundraiser_id: fundraiserId,
      template_id: templateId,
    }),
  });

  if (!response.ok) {
    const fallbackError = "Error applying template";
    const data = await response.json().catch(() => null);
    const message = data?.detail ?? (data ? JSON.stringify(data) : fallbackError);
    throw new Error(message);
  }

  return await response.json();
}
