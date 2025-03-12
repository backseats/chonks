import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { marketplaceContract, marketplaceABI, chainId } from "@/config";

export default function useWithdrawBidOnTrait(traitId: number) {
  const [withdrawBidOnTraitError, setWithdrawBidOnTraitError] = useState<string>("");

  const { writeContract: withdrawBidOnTrait, isPending: isWithdrawBidOnTraitPending, data: hashWithdrawBidOnTrait } = useWriteContract();
  const { isSuccess: isWithdrawBidOnTraitSuccess, isError: isWithdrawBidOnTraitError } = useWaitForTransactionReceipt({
    hash: hashWithdrawBidOnTrait,
  });

  const handleWithdrawBidOnTrait = () => {
    setWithdrawBidOnTraitError("");

    if (!traitId) {
      setWithdrawBidOnTraitError("Missing trait ID");
      return;
    }

    try {
      withdrawBidOnTrait({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'withdrawBidOnTrait',
        args: [BigInt(traitId)],
        chainId,
      }, {
        onSuccess: (data) => console.log('Transaction submitted:', data),
        onError: (error) => {
          console.error('Transaction failed:', error);
          const errorMessage = (error as Error).message;
          if (errorMessage.includes('MustWaitToWithdrawBid')) {
            setWithdrawBidOnTraitError('You must wait 100 seconds before cancelling your offer');
          } else {
            setWithdrawBidOnTraitError(`Failed to withdraw bid: ${errorMessage}`);
          }
        }
      });
    } catch (error) {
      console.error('Error withdrawing bid:', error);
      setWithdrawBidOnTraitError(`Error preparing transaction: ${(error as Error).message}`);
    }
  };

  return {
    handleWithdrawBidOnTrait,
    isWithdrawBidOnTraitPending,
    isWithdrawBidOnTraitSuccess,
    isWithdrawBidOnTraitError,
    withdrawBidOnTraitError,
  };
}
