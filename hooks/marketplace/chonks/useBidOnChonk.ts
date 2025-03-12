import { useWriteContract } from "wagmi";
import { marketplaceContract, marketplaceABI } from "@/config";
import { parseEther } from "viem";

export default function useBidOnChonk(chonkId: number) {
  const { writeContract: bidOnChonk, isPending: isBidOnChonkPending, isSuccess: isBidOnChonkSuccess, isError: isBidOnChonkError } = useWriteContract();

  const handleBidOnChonk = (offerInEth: string) => {
    try {
      const amountInWei = parseEther(offerInEth);
      bidOnChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'bidOnChonk',
        args: [BigInt(chonkId)],
        value: amountInWei
      }, {
        onError: (error) => {
          console.error('Error placing bid:', error);
          // alert('Error placing bid: ' + error);
        },
      });
    } catch (error) {
      console.error('Error placing bid:', error);
      // alert('Error placing bid: ' + error);
    }
  };

  return {
    handleBidOnChonk,
    isBidOnChonkPending,
    isBidOnChonkSuccess,
    isBidOnChonkError,
  }
}
