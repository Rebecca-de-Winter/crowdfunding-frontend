import { useEffect, useRef, useState } from "react";
import getFundraiserTotals from "../api/get-fundraiser-totals";

export default function useFundraiserTotals(fundraiserId) {
  const [state, setState] = useState({
    data: null,
    isLoading: false,
    error: null,
  });

  const runIdRef = useRef(0);

  useEffect(() => {
    const id = fundraiserId ? String(fundraiserId) : "";

    if (!id) {
      queueMicrotask(() => {
        setState({ data: null, isLoading: false, error: null });
      });
      return;
    }

    const runId = ++runIdRef.current;

    // defer "loading" update
    queueMicrotask(() => {
      // ignore stale effect runs (strict mode / fast refresh)
      if (runIdRef.current !== runId) return;
      setState((prev) =>
        prev.isLoading && prev.error == null
          ? prev
          : { ...prev, isLoading: true, error: null }
      );
    });

    (async () => {
      try {
        const json = await getFundraiserTotals(id);
        if (runIdRef.current !== runId) return;

        queueMicrotask(() => {
          if (runIdRef.current !== runId) return;
          setState({ data: json, isLoading: false, error: null });
        });
      } catch (e) {
        if (runIdRef.current !== runId) return;

        queueMicrotask(() => {
          if (runIdRef.current !== runId) return;
          setState({ data: null, isLoading: false, error: e });
        });
      }
    })();
  }, [fundraiserId]);

  return state;
}
