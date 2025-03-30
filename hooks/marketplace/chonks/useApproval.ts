import { useState, useEffect } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { mainContract, mainABI, marketplaceContract, chainId } from "@/config"
import { Address } from "viem";

// This should be roughly the same for traits, just using the traits contract
export default function useApproval(address: Address | undefined) {

  // localApproved is for when the user has approved the marketplace.
  const [localApproved, setLocalApproved] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const { data: isApproved } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: 'isApprovedForAll',
    args: [address, marketplaceContract]
    chainId,
  }) as { data: boolean | undefined, refetch: () => Promise<any> };

  const finalIsApproved = isApproved || localApproved;

  const { writeContract: approveMarketplace, isPending: isApprovalPending, isError: isApprovalError, isSuccess: isApprovalSuccess } = useWriteContract();

  const handleApproveMarketplace = () => {
    if (!address) return;
    setApprovalError(null);

    try {
      approveMarketplace({
        address: mainContract,
        abi: mainABI,
        functionName: 'setApprovalForAll',
        args: [marketplaceContract, true],
        chainId,
      }, {
        onError: (error) => {
          // console.error('Error approving marketplace:', error);
          if (error.message.includes("User rejected the request")) {
            setApprovalError("Please approve the marketplace to continue");
          } else {
            setApprovalError("An approval signing message occurred");
          }

        }
      });
    } catch (error) {
      // console.error('Error approving marketplace:', error);
      setApprovalError("A generic approval signing message occurred");
    }
  };

  useEffect(() => {
    if (isApprovalSuccess) setLocalApproved(true);
  }, [isApprovalSuccess]);

  return {
    finalIsApproved,
    handleApproveMarketplace,
    isApprovalError,
    isApprovalPending,
    isApprovalSuccess,
    approvalError
  }

}
