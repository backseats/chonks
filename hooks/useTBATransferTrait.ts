import { traitsABI, traitsContract, chainId } from "@/config";
import { Address, encodeFunctionData } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";

export function useTBATransferTrait(tokenboundClient: TokenboundClient) {

  const encodedData = (from: Address, to: Address, traitId: string) => {
    return encodeFunctionData({
      abi: traitsABI,
      functionName: "safeTransferFrom",
      args: [from, to, traitId],
    });
  };

  const transferTrait = (from: Address, to: Address, traitId: string) => {
    tokenboundClient.execute({
      account: from,
      to: traitsContract,
      value: 0n,
      data: encodedData(from, to, traitId),
      chainId,
    });
  }

  return { transferTrait };
}
