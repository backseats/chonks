import { useWriteContract } from "wagmi";
import { mainContract, mainABI, marketplaceContract, chainId } from "@/config";

export function useEOAApprovalWrite() {
  const { writeContract } = useWriteContract();

  const approveEOAForMarketplace = () => {
    writeContract({
      address: mainContract,
      abi: mainABI,
      functionName: "setApprovalForAll",
      args: [marketplaceContract, true],
      chainId
    });
  }

  const disconnectEOA = () => {
    writeContract({
      address: mainContract,
      abi: mainABI,
      functionName: "setApprovalForAll",
      args: [marketplaceContract, false],
      chainId
    });
  }

  return { approveEOAForMarketplace, disconnectEOA };
}
