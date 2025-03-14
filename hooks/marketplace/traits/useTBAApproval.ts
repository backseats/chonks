import { useState } from "react";
import { useReadContract } from "wagmi";
import { marketplaceContract, traitsContract, traitsABI, chainId } from "@/config";
import { Address, encodeFunctionData } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import { useWalletClient } from "wagmi";

export function useTBAApproval(tbaAddress: Address | null) {
  const [localApproved, setLocalApproved] = useState(false);
  const [approvalError, setApprovalError] = useState<string>("");

  if (!tbaAddress) return { tbaIsApproved: false };

  const { data: walletClient } = useWalletClient();
  const tokenboundClient = new TokenboundClient({
      walletClient,
      chainId,
  });

  const { data: tbaIsApproved } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "isApprovedForAll",
    args: [tbaAddress, marketplaceContract],
    chainId,
  }) as { data: boolean };

  const finalIsApproved = tbaIsApproved || localApproved;

  const encodedData = (value: boolean) => {
    return encodeFunctionData({
      abi: traitsABI,
      functionName: "setApprovalForAll",
      args: [marketplaceContract, value],
    });
  };

  const handleApproveTBAForMarketplace = async () => {
    try {
      await tokenboundClient.execute({
        account: tbaAddress as Address,
        to: traitsContract,
        value: 0n,
        data: encodedData(true),
      });

      // Successfully approved TBA for marketplace
      setLocalApproved(true);

      // console.log("Success: TBA approval transaction", tx);
    } catch (error) {
      console.error("errror: approveTBAForMarketplace :: useTBAApproval", error);
      setApprovalError("A TBA approval signing message occurred");
      throw error;
    }
  }

  const disconnectTBA = async () => {
    if (!tbaAddress) return;

    const tx = await tokenboundClient.execute({
      account: tbaAddress,
      to: traitsContract,
      value: 0n,
      data: encodedData(false),
      chainId,
    });

    return tx
  }

  return {
    finalIsApproved,
    handleApproveTBAForMarketplace,
    approvalError,
    disconnectTBA
  };
}
