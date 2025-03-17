import { useReadContract } from "wagmi";
import { mainContract, traitsContract, chainId } from "../config";

const abi = [
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export function useChonksTotalSupply() {
  const { data: totalSupply } = useReadContract({
    address: mainContract,
    abi,
    functionName: "totalSupply",
    chainId,
  });

  return totalSupply as bigint | undefined;
}

export function useTraitsTotalSupply() {
  const { data: totalSupply } = useReadContract({
    address: traitsContract,
    abi,
    functionName: "totalSupply",
    chainId,
  });

  return totalSupply as bigint | undefined;
}
