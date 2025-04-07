import { useState } from "react";
import { marketplaceContract, traitsContract, traitsABI, chainId } from "@/config";
import { Address, encodeFunctionData } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import { WalletClient } from "viem";

interface Props {
  walletClient: WalletClient | undefined;
  tbaAddress: Address | null;
  refetchTBAIsApproved: () => void;
}

export function useTBAApproval(props: Props) {
  const { walletClient, tbaAddress, refetchTBAIsApproved  }  = props;

  const [approvalError, setApprovalError] = useState<string>("");

  if (!tbaAddress) return { tbaIsApproved: false };

  const tokenboundClient = walletClient ? new TokenboundClient({
      walletClient,
      chainId,
  }) : null;

  const encodedData = (value: boolean) => {
    return encodeFunctionData({
      abi: traitsABI,
      functionName: "setApprovalForAll",
      args: [marketplaceContract, value],
    });
  };

  const handleApproveTBAForMarketplace = async () => {
    if (!tokenboundClient) {
      setApprovalError("Wallet not connected or initialized");
      throw new Error("Tokenbound client not initialized");
    }

    try {
      await tokenboundClient.execute({
        account: tbaAddress as Address,
        to: traitsContract,
        value: 0n,
        data: encodedData(true),
      });

      refetchTBAIsApproved();

      // console.log("Success: TBA approval transaction", tx);
    } catch (error) {
      console.error("errror: approveTBAForMarketplace :: useTBAApproval", error);
      setApprovalError("A TBA approval signing message occurred");
      throw error;
    }
  }

  return {
    handleApproveTBAForMarketplace,
    approvalError,
  };
}
