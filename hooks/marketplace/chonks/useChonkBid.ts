import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { marketplaceContract, marketplaceABI } from "@/config";
import { zeroAddress } from "viem";

export default function useChonkBid(chonkId: number) {

  const { data: chonkBidData, refetch: refetchChonkBid } = useReadContract({
    address: marketplaceContract,
    abi: marketplaceABI,
    functionName: 'getChonkBid',
    args: [BigInt(chonkId)],
  }) as { data: [string, bigint, bigint[], string], refetch: () => void }; // matches return types from contract

  // Convert array to object
  const chonkBid = useMemo(() => {
    if (!chonkBidData || chonkBidData[0] === zeroAddress) return null;

    // console.log('chonkBidData:', chonkBidData);
    return {
      bidder: chonkBidData[0],
      amountInWei: chonkBidData[1],
    };
  }, [chonkBidData]);

  const hasActiveBid = useMemo(() => Boolean(chonkBid), [chonkBid]);

  return {
    chonkBid,
    hasActiveBid,
    refetchChonkBid,
  }
}
