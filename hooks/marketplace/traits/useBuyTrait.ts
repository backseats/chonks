import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { marketplaceContract, marketplaceABI, chainId } from "@/config";
import { parseEther } from "viem";

export default function useBuyTrait(traitId: number) {
  const [buyTraitError, setBuyTraitError] = useState<string>("");

  const { writeContract: buyTrait, isPending: isBuyTraitPending, data: hashBuyTrait } = useWriteContract();
  const { isSuccess: isBuyTraitSuccess, isError: isBuyTraitError } = useWaitForTransactionReceipt({
    hash: hashBuyTrait,
  });

  const handleBuyTrait = (priceInEth: number, chonkId: number) => {
    setBuyTraitError("");

    if (!traitId || chonkId === 0) {
      setBuyTraitError("Missing trait ID or Chonk ID");
      return;
    }

    try {
      const priceInWei = parseEther(priceInEth.toString());

      buyTrait({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'buyTrait',
        args: [BigInt(traitId), BigInt(chonkId)],
        value: priceInWei,
        chainId,
      }, {
        onSuccess: (data) => console.log('Transaction submitted:', data),
        onError: (error) => {
          console.error('Transaction failed:', error);
          setBuyTraitError(`Failed to buy trait: ${(error as Error).message}`);
        }
      });
    } catch (error) {
      console.error('Error in handleBuyTrait:', error);
      setBuyTraitError(`Error preparing transaction: ${(error as Error).message}`);
    }
  };

  return {
    handleBuyTrait,
    isBuyTraitPending,
    isBuyTraitSuccess,
    isBuyTraitError,
    buyTraitError,
  };
}
