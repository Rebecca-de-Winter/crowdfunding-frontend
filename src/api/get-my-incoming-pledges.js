// src/api/get-my-incoming-pledges.js
import getMyFundraisersReport from "./get-my-fundraisers-report";
import getFundraiserPledgesReport from "./get-fundraiser-pledges-report";

function safeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export default async function getMyIncomingPledges() {
  const myFundraisers = safeArray(await getMyFundraisersReport());

  const fundraiserIds = myFundraisers
    .map((f) => f.id ?? f.fundraiser_id ?? f.pk ?? null)
    .filter(Boolean);

  if (fundraiserIds.length === 0) {
    return { fundraisers_count: 0, pledges: [] };
  }

  // Fan-out fetch. Use allSettled so one failure doesn't kill everything.
  const results = await Promise.allSettled(
    fundraiserIds.map((id) => getFundraiserPledgesReport(id))
  );

  const pledges = results.flatMap((r, idx) => {
    const fundraiser_id = fundraiserIds[idx];

    if (r.status !== "fulfilled") {
      console.warn("Incoming pledges: failed for fundraiser", fundraiser_id, r.reason);
      return [];
    }

    const report = r.value;

    // Try common shapes: { pledges: [] } OR { results: [] } OR [].
    const list =
      Array.isArray(report?.pledges) ? report.pledges : safeArray(report);

    // Attach fundraiser_id as a fallback (some reports already include it)
    return list.map((p) => ({
      ...p,
      fundraiser_id: p.fundraiser_id ?? p.fundraiser ?? fundraiser_id,
      _source: "incoming",
    }));
  });

  return {
    fundraisers_count: fundraiserIds.length,
    pledges,
  };
}
