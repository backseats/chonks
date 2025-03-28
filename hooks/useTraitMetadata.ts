import { useState, useEffect } from "react";
import { GET_TRAIT_METADATA_BY_ID } from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";
import { getTraitData } from "@/hooks/traitHooks";

export type TraitMetadata = {
  id: string;
  traitType: number;
  traitName: string;
  colorMap: string;
};

// a mess and unused
export function useTraitMetadata(traitTokenId: string) {
  const [traitMetadata, setTraitMetadata] = useState<TraitMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTraitMetadata = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await client.query({
          query: GET_TRAIT_METADATA_BY_ID,
          variables: { id: traitTokenId },
        });

        if (
          !data?.data?.traitMetadata?.items ||
          data?.data?.traitMetadata?.items?.length === 0
        ) {
          const errorMsg = `Error fetching trait metadata for trait ${traitTokenId}`;
          console.log(errorMsg);
          setError(new Error(errorMsg));
          setTraitMetadata(null);
        } else {
          const metadata = data.data.traitMetadata.items[0] as TraitMetadata;
          setTraitMetadata(metadata);
        }
      } catch (err) {
        console.error("Error fetching trait metadata:", err)

        // Check for 429 status code
        if (err instanceof Error &&
            'networkError' in err &&
            err.networkError &&
            typeof err.networkError === 'object' &&
            err.networkError !== null &&
            'statusCode' in err.networkError &&
            err.networkError.statusCode === 429) {
          console.log("Rate limit exceeded (429). Too many requests.");

          try {
            // Fallback to getTraitData
            const traitData = await getTraitData(traitTokenId);
            console.log("traitData", traitData);
            // debugger
            // setTraitMetadata(traitData);
          } catch (fallbackErr) {
            console.error("Fallback data fetch also failed:", fallbackErr);
          }
          // setError(new Error("Rate limit exceeded. Please try again later."));
        } else {
          // Handle other errors
          setError(err instanceof Error ? err : new Error(String(err)));

          try {
            // Fallback to getTraitData
            const traitData = await getTraitData(traitTokenId);
            console.log("traitData", traitData);
            debugger
            // setTraitMetadata(traitData);
          } catch (fallbackErr) {
            console.error("Fallback data fetch also failed:", fallbackErr);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (traitTokenId) {
      fetchTraitMetadata();
    }
  }, [traitTokenId]);

  return { traitMetadata, isLoading, error };
}
