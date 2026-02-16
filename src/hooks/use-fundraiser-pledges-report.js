import { useEffect, useRef, useState } from "react";
import getFundraiserPledgesReport from "../api/get-fundraiser-pledges-report";

const INITIAL = {
  report: null,
  isLoading: false,
  error: null,
};

export default function useFundraiserPledgesReport(fundraiserId) {
  const [state, setState] = useState(INITIAL);
  const runIdRef = useRef(0);

  useEffect(() => {
    const id = fundraiserId ? String(fundraiserId) : "";

    if (!id) {
      queueMicrotask(() => setState(INITIAL));
      return;
    }

    // ✅ NEW: if logged out, never call the owner-only report
    const token = window.localStorage.getItem("token");
    if (!token) {
      queueMicrotask(() => setState(INITIAL));
      return;
    }

    const runId = ++runIdRef.current;

    queueMicrotask(() => {
      if (runIdRef.current !== runId) return;
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    });

    (async () => {
      try {
        const data = await getFundraiserPledgesReport(id);
        if (runIdRef.current !== runId) return;

        queueMicrotask(() => {
          if (runIdRef.current !== runId) return;
          setState({ report: data, isLoading: false, error: null });
        });
      } catch (err) {
        if (runIdRef.current !== runId) return;

        queueMicrotask(() => {
          if (runIdRef.current !== runId) return;
          setState({ report: null, isLoading: false, error: err });
        });
      }
    })();
  }, [fundraiserId]);

  return state ?? INITIAL;
}
