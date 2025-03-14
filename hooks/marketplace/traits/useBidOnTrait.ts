import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { marketplaceContract, marketplaceABI, chainId } from "@/config";
import { parseEther } from "viem";

export default function useBidOnTrait(traitId: number) {
  const [bidOnTraitError, setBidOnTraitError] = useState<string>("");

  const { writeContract: bidOnTrait, isPending: isBidOnTraitPending, data: hashBidOnTrait } = useWriteContract();
  const { isSuccess: isBidOnTraitSuccess, isError: isBidOnTraitError } = useWaitForTransactionReceipt({
    hash: hashBidOnTrait,
  });

  const handleBidOnTrait = (chonkId: number, offerInEth: string) => {
    setBidOnTraitError("");

    if (!traitId || chonkId === 0 || !offerInEth) {
      setBidOnTraitError("Missing trait ID, Chonk ID, or offer amount");
      return;
    }

    try {
      const amountInWei = parseEther(offerInEth);

      bidOnTrait({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'bidOnTrait',
        args: [BigInt(traitId), BigInt(chonkId)],
        value: amountInWei,
        chainId,
      }, {
        onSuccess: (data) => console.log('Transaction submitted:', data),
        onError: (error) => {
          console.error('Transaction failed:', error);
          setBidOnTraitError(`Failed to place bid: ${(error as Error).message}`);
        }
      });
    } catch (error) {
      console.error('Error placing bid:', error);
      setBidOnTraitError(`Error preparing transaction: ${(error as Error).message}`);
    }
  };

  return {
    handleBidOnTrait,
    isBidOnTraitPending,
    isBidOnTraitSuccess,
    isBidOnTraitError,
    bidOnTraitError,
  };
}
