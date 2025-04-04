import { useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { mainContract, mainABI, chainId } from "@/config";

export function useUnequipTrait(chonkId: number, traitId: number) {
  const [unequipTraitError, setUnequipTraitError] = useState<string | null>(null);

  const { data: isEquipped, refetch: refetchIsEquipped } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: "checkIfTraitIsEquipped",
    args: [chonkId, traitId],
    chainId,
  });

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
    unequipTraitError,
    isTraitEquipped: isEquipped,
    refetchIsEquipped,
  };
}
