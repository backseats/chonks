import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { marketplaceContract, marketplaceABI, chainId } from "@/config";
import { Address } from "viem";

export default function useCancelOfferTrait(address: Address | undefined, traitId: number) {
  const [cancelOfferTraitError, setCancelOfferTraitError] = useState<string>("");

  const { writeContract: cancelOfferTrait, isPending: isCancelOfferTraitPending, data: hashCancelOfferTrait } = useWriteContract();
  const { isSuccess: isCancelOfferTraitSuccess, isError: isCancelOfferTraitError } = useWaitForTransactionReceipt({
    hash: hashCancelOfferTrait,
  });

  const handleCancelOfferTrait = (chonkId: number) => {
    setCancelOfferTraitError("");

    if (!address || !traitId || chonkId === 0) {
      setCancelOfferTraitError("Missing address, trait ID, or Chonk ID");
      return;
    }

    try {
      cancelOfferTrait({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'cancelOfferTrait',
        args: [BigInt(traitId), BigInt(chonkId)],
        chainId,
      }, {
        onSuccess: (data) => console.log('Transaction submitted:', data),
        onError: (error) => {
          console.error('Transaction failed:', error);
          setCancelOfferTraitError(`Failed to cancel offer: ${(error as Error).message}`);
        }
      });
    } catch (error) {
      console.error('Error in handleCancelOfferTrait:', error);
      setCancelOfferTraitError(`Error preparing transaction: ${(error as Error).message}`);
    }
  };

  // For consistency with the Chonks marketplace hooks
  const isCancelOfferTraitRejected = isCancelOfferTraitError;

  return {
    handleCancelOfferTrait,
    isCancelOfferTraitPending,
    isCancelOfferTraitSuccess,
    isCancelOfferTraitRejected,
    cancelOfferTraitError,
  };
}
