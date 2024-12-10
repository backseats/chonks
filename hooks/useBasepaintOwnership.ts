import { useReadContract } from 'wagmi';
import { Address } from 'viem';

const abi = [
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" }
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function useBasePaintOwnership(tbaAddress: Address) {
  const { data: balance } = useReadContract({
    address: "0xba5e05cb26b78eda3a2f8e3b3814726305dcac83",
    abi: abi,
    functionName: "balanceOf",
    args: [tbaAddress, 485n],
    chainId: 8453,
  });

  return balance && balance > 0;
}
