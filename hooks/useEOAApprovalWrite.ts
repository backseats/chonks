import { useWriteContract } from "wagmi";
import { mainContract, mainABI, marketplaceContract } from "@/contract_data";
import { baseSepolia, base } from "viem/chains";

const chainId = baseSepolia.id; // DEPLOY: change to base

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
