import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther } from 'viem';
import {
  marketplaceContract,
  marketplaceABI,
  chainId,
} from "@/config";
import { Category } from "@/types/Category";



export const categoryList = Object.values(Category);

export function useMarketplaceActions(chonkId: number) {
  const { address } = useAccount();

  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  Buy Chonk  ////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////


  // Buy chonk
  // const { writeContract: buyChonk } = useWriteContract();
  const { writeContract: buyChonk, isPending: isBuyChonkPending, data: hashBuyChonk } = useWriteContract();
  const { isLoading: isBuyChonkLoading, isSuccess: isBuyChonkSuccess, isError: isBuyChonkErrror, data: receiptBuyChonk } = useWaitForTransactionReceipt({
    hash: hashBuyChonk,
  });

  const handleBuyChonk = (priceInEth: number) => {
    if (!address || !chonkId) {
      console.log('Early return - missing address or chonkId:', { address, chonkId });
      return;
    }

    try {
      console.log('Attempting to buy chonk:', { chonkId, priceInEth });
      const priceInWei = parseEther(priceInEth.toString());
      console.log('Price in Wei:', priceInWei);

      buyChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'buyChonk',
        args: [BigInt(chonkId)],
        value: priceInWei
      }, {
        onSuccess: (data) => console.log('Transaction submitted:', data),
        onError: (error) => {
          console.error('Transaction failed:', error);
          alert('Error buying chonk: ' + error);
        }
      });
    } catch (error) {
      console.error('Error in handleBuyChonk:', error);
      alert('Error buying chonk: ' + error);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  Accept Bid  ////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  // Add new hook for accepting bids
  // const { writeContract: acceptBid } = useWriteContract();
  const { writeContract: acceptBid, isPending: isAcceptBidPending, data: hashAcceptBid } = useWriteContract();
  const { isLoading: isAcceptBidLoading, isSuccess: isAcceptBidSuccess, isError: isAcceptBidErrror, data: receiptAcceptBid } = useWaitForTransactionReceipt({
    hash: hashAcceptBid,
  });

  const handleAcceptBidForChonk = (bidder: string) => {
    if (!address || !chonkId) return;

    try {
      acceptBid({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'acceptBidForChonk',
        args: [BigInt(chonkId), bidder],
        chainId,
      }, {
        onError: (error) => {
          console.error('Error accepting bid:', error);
          alert('Error accepting bid: ' + error);
        }
      });
    } catch (error) {
      console.error('Error accepting bid:', error);
      alert('Error accepting bid: ' + error);
    }
  };

  return {
    handleAcceptBidForChonk,
    handleBuyChonk,
  };
}
