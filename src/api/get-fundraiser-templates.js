async function getFundraiserTemplates() {
  const url = `${import.meta.env.VITE_API_URL}fundraiser-templates/`;

  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    const fallbackError = "Error fetching fundraiser templates";
    const data = await response.json().catch(() => null);
    const errorMessage = data?.detail ?? fallbackError;
    throw new Error(errorMessage);
  }

  return await response.json();
}

export default getFundraiserTemplates;
