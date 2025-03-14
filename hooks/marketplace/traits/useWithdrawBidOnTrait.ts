import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { marketplaceContract, marketplaceABI, chainId } from "@/config";
import { BaseError, ContractFunctionRevertedError } from "viem";

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
        // onSuccess: (data) => {
        //   debugger
        //   console.log('Transaction submitted:', data),
        // },
        onError: (error) => {
          debugger
        //   if (error instanceof BaseError) {
        //     debugger
        //     const revertError = error.walk(err => err instanceof ContractFunctionRevertedError)
        //     if (revertError instanceof ContractFunctionRevertedError) {
        //       const errorName = revertError.data?.errorName ?? ''
        //       // do something with `errorName`
        //     }
        //   }
        //   console.error('Transaction failed:', error);
        //   const errorMessage = (error as Error).message;
        //   if (errorMessage.includes('MustWaitToWithdrawBid')) {
        //     setWithdrawBidOnTraitError('You must wait 100 seconds before cancelling your Offer');
        //   } else if (errorMessage.includes("User rejected the request")) {
        //     setWithdrawBidOnTraitError('Confirm with your wallet to withdraw your Bid');
        //   } else {
        //     setWithdrawBidOnTraitError(`Failed to withdraw bid: ${errorMessage}`);
        //   }
        }
      });
    } catch (error) {
      console.error('Error withdrawing bid:', error);
      debugger
      // setWithdrawBidOnTraitError(`Error preparing transaction: ${(error as Error).message}`);

      if (error instanceof BaseError) {
        debugger
        const revertError = error.walk(err => err instanceof ContractFunctionRevertedError)
        if (revertError instanceof ContractFunctionRevertedError) {
          const errorName = revertError.data?.errorName ?? ''
          // do something with `errorName`
        }
      }
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
