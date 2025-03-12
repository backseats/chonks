import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { marketplaceContract, marketplaceABI, chainId } from "@/config";
import { zeroAddress } from "viem";

export default function useGetTraitBid(traitId: number) {
  // Read the current bid from the contract
  const { data: traitBidData, refetch: refetchTraitBid, error } = useReadContract({
    address: marketplaceContract,
    abi: marketplaceABI,
    functionName: 'getTraitBid',
    args: [BigInt(traitId)],
    chainId,
  }) as { data: [string, bigint, bigint, string], refetch: () => void, error: Error | null };

  // Convert array to object
  const traitBid = useMemo(() => {
    if (!traitBidData || traitBidData[0] === zeroAddress) return null;

    return {
      bidder: traitBidData[0],
      bidderTBA: traitBidData[1],
      amountInWei: traitBidData[2],
      traitbidBlockNumberIds: traitBidData[3]
    };
  }, [traitBidData]);

  const hasActiveBid = useMemo(() => {
    return Boolean(traitBid);
  }, [traitBid]);

  // String error state
  const getTraitBidError = error ? `Failed to fetch trait bid: ${error.message}` : "";

  return {
    traitBid,
    hasActiveBid,
    refetchTraitBid,
    getTraitBidError,
  };
}
