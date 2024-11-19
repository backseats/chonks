import { useWriteContract } from "wagmi";
import { mainContract, mainABI, marketplaceContract } from "@/contract_data";
import { baseSepolia } from "viem/chains";
export function useEOAApprovalWrite() {
  const { writeContract } = useWriteContract();

  const approveEOAForMarketplace = () => {
    writeContract({
      address: mainContract,
      abi: mainABI,
      functionName: "setApprovalForAll",
      args: [marketplaceContract, true],
      chainId: baseSepolia.id,
    });
  }

  const disconnectEOA = () => {
    writeContract({
      address: mainContract,
      abi: mainABI,
      functionName: "setApprovalForAll",
      args: [marketplaceContract, false],
      chainId: baseSepolia.id,
    });
  }

  return { approveEOAForMarketplace, disconnectEOA };
}
