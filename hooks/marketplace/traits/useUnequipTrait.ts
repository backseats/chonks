import { useState } from "react";
import { useWriteContract } from "wagmi";
import { mainContract, mainABI, chainId } from "@/config";

export function useUnequipTrait() {
  const [unequipTraitError, setUnequipTraitError] = useState<string | null>(null);

  const {
    writeContract,
    isPending: isUnequipTraitPending,
    isSuccess: isUnequipTraitSuccess,
    isError: isUnequipTraitError,
  } = useWriteContract();

  const handleUnequipTrait = (chonkId: number, traitTypeId: number | undefined) => {
    if (!traitTypeId) return;

    writeContract({
      address: mainContract,
      abi: mainABI,
      functionName: "unequip",
      args: [BigInt(chonkId), traitTypeId],
      chainId,
    }, {
      onError: (error) => {
        setUnequipTraitError(error.message);
      }
    });
  };

  return {
    handleUnequipTrait,
    isUnequipTraitPending,
    isUnequipTraitSuccess,
    isUnequipTraitError,
    unequipTraitError
  };
}
