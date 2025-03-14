import { useState } from "react";
import { useWriteContract } from "wagmi";
import {
  marketplaceContract,
  marketplaceABI,
  chainId,
} from "@/config";

export default function useAcceptChonkBid(chonkId: number) {

  const [acceptBidError, setAcceptBidError] = useState<string | null>(null);

  const { writeContract: acceptBid, isPending: isAcceptBidPending, isSuccess: isAcceptBidSuccess, isError: isAcceptBidError } = useWriteContract();

  const handleAcceptBidForChonk = (bidder: string) => {
    acceptBid({
      address: marketplaceContract,
      abi: marketplaceABI,
      functionName: 'acceptBidForChonk',
      args: [BigInt(chonkId), bidder],
      chainId,
    }, {
        onError: (error) => {
          console.error('Error accepting bid:', error);
          if (error.message.includes("User denied transaction signature")) {
            setAcceptBidError("Please confirm with your wallet to accept the bid");
          } else {
            setAcceptBidError(error.message);
          }
        }
      });
  };

  return {
    handleAcceptBidForChonk,
    isAcceptBidPending,
    isAcceptBidSuccess,
    isAcceptBidError,
    acceptBidError,
  };
}
