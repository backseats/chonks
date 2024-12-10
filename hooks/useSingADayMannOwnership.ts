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

export function useSongDaymannOwnership(tbaAddress: Address) {
  const { data: balance } = useReadContract({
    address: "0xb3bad5fe12268edc8a52ff786076c1d1fa92ef0d",
    abi,
    functionName: "balanceOf",
    args: [tbaAddress, 2n],
    chainId: 8453,
  });

  return balance && balance > 0;
}
