import { mainABI, traitsABI, marketplaceContract, traitsContract, chain } from "@/config";
import { Address, encodeFunctionData } from "viem";
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
      abi: traitsABI,
      functionName: "setApprovalForAll",
      args: [marketplaceContract, value],
    });
  };

  const approveTBAForMarketplace = async () => {
    console.log("approveTBAForMarketplace :: useTBAApprovalWrite", tbaAddress);
    console.log("chain.id", chain.id);

    try {
      const tx = await tokenboundClient.execute({
        account: tbaAddress,
        to: traitsContract,
        value: 0n,
        data: encodedData(true),
        chainId: chain.id,
      });
      console.log("Success: TBA approval transaction", tx);
      return tx;
    } catch (error) {
      console.error("errror: approveTBAForMarketplace :: useTBAApprovalWrite", error);
      throw error;
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
