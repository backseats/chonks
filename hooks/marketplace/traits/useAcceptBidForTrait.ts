import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { marketplaceContract, marketplaceABI, chainId } from "@/config";

export default function useAcceptBidForTrait(traitId: number) {
  const [acceptBidError, setAcceptBidError] = useState<string>("");

  const { writeContract: acceptBid, isPending: isAcceptBidPending, data: hashAcceptBid } = useWriteContract();
  const { isSuccess: isAcceptBidSuccess, isError: isAcceptBidError } = useWaitForTransactionReceipt({
    hash: hashAcceptBid,
  });

  const handleAcceptBidForTrait = (bidder: string) => {
    setAcceptBidError("");

    if (!traitId || !bidder) {
      setAcceptBidError("Missing trait ID or bidder address");
      return;
    }

    try {
      acceptBid({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'acceptBidForTrait',
        args: [BigInt(traitId), bidder],
        chainId,
      }, {
        onSuccess: (data) => console.log('Transaction submitted:', data),
        onError: (error) => {
          console.error('Transaction failed:', error);
          setAcceptBidError(`Failed to accept bid: ${(error as Error).message}`);
        }
      });
    } catch (error) {
      console.error('Error accepting bid:', error);
      setAcceptBidError(`Error preparing transaction: ${(error as Error).message}`);
    }
  };

  return {
    handleAcceptBidForTrait,
    isAcceptBidPending,
    isAcceptBidSuccess,
    isAcceptBidError,
    acceptBidError,
  };
}
