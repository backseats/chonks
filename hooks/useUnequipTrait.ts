import { useWriteContract } from "wagmi";
import { mainContract, mainABI, chainId } from "@/config";

export function useUnequipTrait() {
  const {
    writeContract,
    isPending,
    data: hash,
    isSuccess,
    isError,
    error
  } = useWriteContract();

  const handleUnequipTrait = (chonkId: number, traitTypeId: number | undefined) => {
    if (!traitTypeId) return;

    writeContract({
      address: mainContract,
      abi: mainABI,
      functionName: "unequip",
      args: [BigInt(chonkId), traitTypeId],
      chainId,
    });
  };

  return {
    handleUnequipTrait,
    isUnequipTraitPending: isPending,
    hashUnequipTrait: hash,
    isUnequipTraitSuccess: isSuccess,
    isUnequipTraitError: isError,
    unequipTraitError: error
  };
}
