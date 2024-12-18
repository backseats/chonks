import { useReadContract } from 'wagmi';
import { Address } from 'viem';
import { chainId } from "@/contract_data";

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

const erc721Abi = [
  {
    inputs: [
      { name: "owner", type: "address" }
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;


export function useSongDaymannOwnership(tbaAddress: Address) {
  const { data: balance } = useReadContract({
    address: "0xb3bad5fe12268edc8a52ff786076c1d1fa92ef0d",
    abi,
    functionName: "balanceOf",
    args: [tbaAddress, 2n],
    chainId,
  });

  return balance && balance > 0;
}

export function useFarWestOwnership(tbaAddress: Address) {
  const { data: balance } = useReadContract({
    address: "0x0000000080d04343d60d06e1a36aaf46c9242805",
    abi: erc721Abi,
    functionName: "balanceOf",
    args: [tbaAddress],
    chainId,
  });

  return balance && balance > 0;
}
