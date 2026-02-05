import { useEffect, useMemo, useState } from "react";
import getFundraiserSummary from "../api/get-fundraiser-summary";

export default function useFundraiserSummary(fundraiserId) {
  const [dataById, setDataById] = useState({});
  const [errorById, setErrorById] = useState({});

  const summary = fundraiserId ? dataById[fundraiserId] : undefined;
  const error = fundraiserId ? errorById[fundraiserId] : undefined;

  const isLoading = useMemo(() => {
    if (!fundraiserId) return false;
    return summary === undefined && error === undefined;
  }, [fundraiserId, summary, error]);

  useEffect(() => {
    if (!fundraiserId) return;

    // If we already have either data or error cached, don't refetch.
    if (dataById[fundraiserId] !== undefined || errorById[fundraiserId] !== undefined) {
      return;
    }

    let cancelled = false;

    getFundraiserSummary(fundraiserId)
      .then((data) => {
        if (cancelled) return;
        setDataById((prev) => ({ ...prev, [fundraiserId]: data }));
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorById((prev) => ({ ...prev, [fundraiserId]: err }));
      });

    return () => {
      cancelled = true;
    };
    // We intentionally only depend on fundraiserId here.
    // Caches are updated via functional setState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fundraiserId]);

  return { summary, isLoading, error };
}
