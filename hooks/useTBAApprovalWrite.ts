import { mainABI, marketplaceContract, traitsContract, chainId} from "@/contract_data";
import { Address, encodeFunctionData } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import { useWalletClient } from "wagmi";
import { base } from "viem/chains";
import { localDefineChain } from "@/config";

export function useTBAApprovalWrite(tbaAddress: Address) {

  console.log("tbaAddress :: useTBAApprovalWrite", tbaAddress);

  const { data: walletClient } = useWalletClient();
  const tokenboundClient = new TokenboundClient({
      walletClient,
      // chainId: base.id,
      // chainId: localDefineChain.id,
      chain: localDefineChain,
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
        // chainId,
        chainId: localDefineChain.id,
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
      // chainId,
      chainId: localDefineChain.id,
    });
  }

  return { approveTBAForMarketplace, disconnectTBA };
}
