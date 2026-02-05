export default async function createMoneyPledge({ pledge, amount, comment = "" }) {
  const url = `${import.meta.env.VITE_API_URL}money-pledges/`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pledge,
      amount,   // keep as string "100.00" if that's what your API expects
      comment,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? "Error creating money pledge");
  }

  return await res.json();
}
