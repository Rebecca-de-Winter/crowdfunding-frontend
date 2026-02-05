import { useCallback, useEffect, useState } from "react";
import getFundraiser from "../api/get-fundraiser";

export default function useFundraiser(fundraiserId) {
  const [fundraiser, setFundraiser] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const data = await getFundraiser(fundraiserId);
      setFundraiser(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fundraiserId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { fundraiser, isLoading, error, refetch };
}
