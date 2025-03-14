import { useReadContract } from 'wagmi';
import { Address } from 'viem';
import { base } from 'wagmi/chains'

const chainId = base.id;

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

export function useBasePaintOwnership485(tbaAddress: Address) {
  const { data: balance } = useReadContract({
    address: "0xba5e05cb26b78eda3a2f8e3b3814726305dcac83",
    abi: abi,
    functionName: "balanceOf",
    args: [tbaAddress, 485n],
    chainId,
  });

  return balance && balance > 0;
}

export function useBasePaintOwnership577(tbaAddress: Address) {
  const { data: balance } = useReadContract({
    address: "0xba5e05cb26b78eda3a2f8e3b3814726305dcac83",
    abi: abi,
    functionName: "balanceOf",
    args: [tbaAddress, 577n],
    chainId,
  });

  return balance && balance > 0;
}
