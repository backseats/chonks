import { mainABI, marketplaceContract, traitsContract } from "@/contract_data";
import { baseSepolia } from "viem/chains";
import { Address, encodeFunctionData } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import { useWalletClient } from "wagmi";

export function useTBAApprovalWrite(tbaAddress: Address) {

  const { data: walletClient } = useWalletClient();
  const tokenboundClient = new TokenboundClient({
      walletClient,
      chainId: baseSepolia.id,
  });

  const encodedData = (value: boolean) => {
    return encodeFunctionData({
      abi: mainABI,
      functionName: "setApprovalForAll",
      args: [marketplaceContract, value],
    });
  };

  const approveTBAForMarketplace = () => {
    tokenboundClient.execute({
      account: tbaAddress,
      to: traitsContract,
      value: 0n,
      data: encodedData(true),
      chainId: baseSepolia.id,
    });
  }

  const disconnectTBA = () => {
    tokenboundClient.execute({
      account: tbaAddress,
      to: traitsContract,
      value: 0n,
      data: encodedData(false),
      chainId: baseSepolia.id,
    });
  }

  return { approveTBAForMarketplace, disconnectTBA };
}
