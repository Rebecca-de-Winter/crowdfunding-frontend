/**
 * authFetch: a small wrapper around fetch that automatically adds
 * your DRF token header if it exists in localStorage.
 */
export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { ...(options.headers || {}) };

  // If sending JSON, set Content-Type (but don't do this for FormData later)
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // DRF token auth usually expects: Authorization: Token <token>
  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  return fetch(url, { ...options, headers });
}
