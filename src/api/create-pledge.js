export default async function createPledge({
  fundraiser,
  need,
  comment = "",
  anonymous = false,
  status = "pending",
}) {
  const url = `${import.meta.env.VITE_API_URL}pledges/`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fundraiser,
      need,
      comment,
      anonymous,
      status,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? "Error creating pledge");
  }

  return await res.json();
}
