export default async function createTimePledge({
  pledge,
  start_datetime,
  end_datetime,
  hours_committed,
  comment = "",
}) {
  const url = `${import.meta.env.VITE_API_URL}time-pledges/`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pledge,
      start_datetime,
      end_datetime,
      hours_committed, // keep as string "4.0" if that’s what your API expects
      comment,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.detail ?? "Error creating time pledge");
  }

  return await res.json();
}
