import { useEffect, useState } from "react";
import getFundraiserPledgesReport from "../api/get-fundraiser-pledges-report";

export default function useFundraiserPledgesReport(fundraiserId) {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fundraiserId) return;

    let isMounted = true; // guard against strict-mode double run

    getFundraiserPledgesReport(fundraiserId)
      .then((data) => {
        if (!isMounted) return;
        setReport(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fundraiserId]);

  return { report, isLoading, error };
}
