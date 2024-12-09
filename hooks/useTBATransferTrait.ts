import { mainABI, traitsABI, marketplaceContract, traitsContract, chainId} from "@/contract_data";
import { Address, encodeFunctionData } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import { useWalletClient } from "wagmi";

export function useTBATransferTrait(tbaAddress1: Address, tbaAddress2: Address, traitId: string) {

//   console.log("tbaAddress1", tbaAddress1);
//   console.log("tbaAddress2", tbaAddress2);
//   console.log("traitId", traitId);

  const { data: walletClient } = useWalletClient();
  const tokenboundClient = new TokenboundClient({
      walletClient,
      chainId,
  });

  const encodedData = () => {
    return encodeFunctionData({
      abi: traitsABI,
      functionName: "transferFrom",
      args: [tbaAddress1, tbaAddress2, traitId],
    });
  };

  const transferTrait = () => {
    tokenboundClient.execute({
      account: tbaAddress1,
      to: traitsContract,
      value: 0n,
      data: encodedData(),
      chainId,
    });
  }

  return { transferTrait };
}
