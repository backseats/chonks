import { mainABI, marketplaceContract, traitsContract, chain } from "@/config";
import { Address, encodeFunctionDatas } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import { useWalletClient } from "wagmi";

export function useTBAApprovalWrite(tbaAddress: Address) {

  console.log("tbaAddress :: useTBAApprovalWrite", tbaAddress);

  const { data: walletClient } = useWalletClient();
  const tokenboundClient = new TokenboundClient({
    walletClient,
    chain,
  });

  const encodedData = (value: boolean) => {
    return encodeFunctionData({
      abi: mainABI,
      functionName: "setApprovalForAll",
      args: [marketplaceContract, value],
    });
  };

  const approveTBAForMarketplace = () => {

    console.log("approveTBAForMarketplace :: useTBAApprovalWrite", tbaAddress);

    try {
      tokenboundClient.execute({
        account: tbaAddress,
        to: traitsContract,
        value: 0n,
        data: encodedData(true),
        chainId: chain.id,
      });
    } catch (error) {
      console.error("approveTBAForMarketplace :: useTBAApprovalWrite", error);
      throw error; // Re-throw the error if you want to handle it in the calling component
    }
  }

  const disconnectTBA = () => {
    tokenboundClient.execute({
      account: tbaAddress,
      to: traitsContract,
      value: 0n,
      data: encodedData(false),
      chainId: chain.id,
    });
  }

  return { approveTBAForMarketplace, disconnectTBA };
}
