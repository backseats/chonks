import { useState } from "react";
import { marketplaceContract, marketplaceABI } from "@/config";
import { useWriteContract } from "wagmi";
import { Address } from "viem";

export default function useCancelOffer(address: Address | undefined, chonkId: number) {
  const { writeContract: cancelOfferChonk, isPending: isCancelOfferChonkPending, isSuccess: isCancelOfferChonkSuccess, isError: isCancelOfferChonkError} = useWriteContract();

  const [isCancelOfferChonkRejected, setIsCancelOfferChonkRejected] = useState(false);

  const handleCancelOfferChonk = () => {
    if (!address || !chonkId) return;

    try {
      cancelOfferChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'cancelOfferChonk',
        args: [BigInt(chonkId)],
      }, {
        onError: (error) => {
          if (error.message.includes("User rejected the request")) {
            setIsCancelOfferChonkRejected(true);
          }
        },
      });
    } catch (error) {
      console.error('Error canceling offer chonk:', error);
      // setCancelError('Error cancelling offer: ' + error);
    }
  };

  return {
    handleCancelOfferChonk,
    isCancelOfferChonkPending,
    isCancelOfferChonkSuccess,
    isCancelOfferChonkError,
    isCancelOfferChonkRejected,
  };

}
