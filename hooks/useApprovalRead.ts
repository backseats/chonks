import { useReadContract } from "wagmi";
import { mainContract, mainABI, marketplaceContract, traitsContract, traitsABI } from "@/contract_data";
import { baseSepolia } from "viem/chains";
import { Address } from "viem";

export function useReadEOAApproval(address: Address | undefined) {
  const { data: EOAIsApproved } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: "isApprovedForAll",
    args: [address, marketplaceContract],
    chainId: baseSepolia.id,
  }) as { data: boolean };

  return { EOAIsApproved };
}

export function useReadTBAApproval(tbaAddress: Address) {
  const { data: TBAIsApproved } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "isApprovedForAll",
    args: [tbaAddress, marketplaceContract],
    chainId: baseSepolia.id,
  }) as { data: boolean };

  return { TBAIsApproved };
}
