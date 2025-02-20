import { traitsABI, marketplaceContract, traitsContract, chain } from "@/config";
import { Address, encodeFunctionData } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import { useWalletClient } from "wagmi";
import { base } from "viem/chains";

export function useTBAApprovalWrite(tbaAddress: Address) {

  const { data: walletClient } = useWalletClient();
  const tokenboundClient = new TokenboundClient({
      walletClient,
      chainId: base.id,
  });

  const encodedData = (value: boolean) => {
    return encodeFunctionData({
      abi: traitsABI,
      functionName: "setApprovalForAll",
      args: [marketplaceContract, value],
    });
  };

  const approveTBAForMarketplace = async () => {
    try {
      const tx = await tokenboundClient.execute({
        account: tbaAddress,
        to: traitsContract,
        value: 0n,
        data: encodedData(true),
      });

      // console.log("Success: TBA approval transaction", tx);
      return tx;
    } catch (error) {
      console.error("errror: approveTBAForMarketplace :: useTBAApprovalWrite", error);
      throw error;
    }
  }

  const disconnectTBA = async () => {
    const tx = await tokenboundClient.execute({
      account: tbaAddress,
      to: traitsContract,
      value: 0n,
      data: encodedData(false),
      chainId: base.id,
    });

    return tx
  }

  return { approveTBAForMarketplace, disconnectTBA };
}
