import { useState } from "react";
import { useWriteContract } from "wagmi";
import { marketplaceContract, marketplaceABI, chainId } from "@/config";

export default function useWithdrawChonkBid(chonkId: number) {
  const [withdrawBidOnChonkError, setWithdrawBidOnChonkError] = useState<string | null>(null);

    const {
      writeContract: withdrawBidOnChonk,
      isPending: isWithdrawBidOnChonkPending,
      isSuccess: isWithdrawBidOnChonkSuccess,
      isError: isWithdrawBidOnChonkError,
      error: withdrawError,
    } = useWriteContract();

  const handleWithdrawBidOnChonk = () => {
    try {
      withdrawBidOnChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'withdrawBidOnChonk',
        args: [BigInt(chonkId)],
        chainId,
      }, {
        onError: (error) => {
          console.log('Withdrawal transaction rejected:', error.message);

          if (error.message.includes('MustWaitToWithdrawBid')) {
            setWithdrawBidOnChonkError('Please wait 2 minutes before cancelling');
          } else if (error.message.includes("User denied transaction signature")) {
            setWithdrawBidOnChonkError('Please confirm with your wallet to cancel');
          } else {
            setWithdrawBidOnChonkError(error.message);
          }
        },
      });
    } catch (error) {
      console.error('Error withdrawing bid:', error);
      // alert('Error withdrawing bid: ' + error);
    }
  };

  return {
    handleWithdrawBidOnChonk,
    isWithdrawBidOnChonkPending,
    isWithdrawBidOnChonkSuccess,
    isWithdrawBidOnChonkError,
    withdrawBidOnChonkError,
  }
}
