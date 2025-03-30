import { useState } from "react";
import { marketplaceContract, marketplaceABI, chainId } from "@/config";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Address } from "viem";

export default function useCancelOffer(address: Address | undefined, chonkId: number) {
  const { writeContract: cancelOfferChonk, isPending: isCancelOfferChonkPending, isSuccess: isCancelOfferChonkSuccess, isError: isCancelOfferChonkError, data: cancelOfferChonkHash} = useWriteContract();

  const { data: cancelOfferChonkReceipt } = useWaitForTransactionReceipt({
    hash: cancelOfferChonkHash,
    chainId,
  });

  const [isCancelOfferChonkRejected, setIsCancelOfferChonkRejected] = useState(false);

  const handleCancelOfferChonk = () => {
    if (!address || !chonkId) return;

    try {
      cancelOfferChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'cancelOfferChonk',
        args: [BigInt(chonkId)],
        chainId,
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
    cancelOfferChonkHash,
    cancelOfferChonkReceipt,
  };

}
