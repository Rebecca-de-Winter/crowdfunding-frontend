export default async function getFundraiserTotals(fundraiserId) {
  const url = `${import.meta.env.VITE_API_URL}reports/fundraisers/${fundraiserId}/totals/`;

  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? "Error fetching fundraiser totals");
  }
  return res.json();
}
