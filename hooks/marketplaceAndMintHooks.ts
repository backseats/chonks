import { useState, useEffect, useMemo } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "wagmi";
import { parseEther } from 'viem';

import {
  mainContract,
  mainABI,
  traitsContract,
  marketplaceContract,
  tokenURIABI,
  traitsABI,
  marketplaceABI,
  chainId,
} from "@/contract_data";
import { Chonk } from "@/types/Chonk";
import { Category } from "@/types/Category";

// Temporarily here because /chonks/[id] is hidden in vercelignore
function decodeAndSetData(data: string, setData: (data: Chonk) => void) {
  const base64String = data.split(",")[1];
  const jsonString = atob(base64String);
  const jsonData = JSON.parse(jsonString) as Chonk;

  setData(jsonData);
}

export const categoryList = Object.values(Category);

export function useMintFunction() {
  const { writeContract, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });
  const [isRejected, setIsRejected] = useState(false);
  const [mainContractTokens, setMainContractTokens] = useState<number[]>();
  const [traitTokens, setTraitTokens] = useState<number[]>();

  const mint = async (amount: number = 1) => {
    if (amount < 1) throw new Error("Amount must be greater than 0");
    setIsRejected(false);
    
    try {
      const tx = await writeContract({
        address: mainContract,
        abi: mainABI,
        functionName: 'mint',
        args: [amount],
        chainId,
      }, {
        onError: (error) => {
          console.log('Transaction rejected:', error);
          setIsRejected(true);
        },
      });
      return tx;
    } catch (error: any) {
      console.log('Mint error:', error);
      throw error;
    }
  };

  // Add effect to log receipt and parse minted token IDs
  useEffect(() => {
    if (isSuccess && receipt) {
      console.log('Transaction Receipt:', receipt);

      console.log('mainContract', mainContract);
      console.log('traitsContract', traitsContract);

      const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
      
      // Parse the logs to find Transfer events
      const mintedTokenIds = receipt.logs
        .filter(log => {
          // Filter for Transfer events (you'll need to match the event signature)
          // The event signature for Transfer is: Transfer(address,address,uint256)
          return log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        })
        .map(log => {
          if (!log.topics[3]) return 0; // Handle undefined case
          const tokenId = BigInt(log.topics[3]);
          return Number(tokenId);
        });

      console.log('Minted Token IDs:', mintedTokenIds);


      const mainContractTokens = receipt.logs
        .filter(log => log.address.toLowerCase() === mainContract.toLowerCase() && log.topics[0] === transferEventSignature)
        .map(log => {
          if (!log.topics[3]) return 0;
          return Number(BigInt(log.topics[3]));
        });

      const traitTokens = receipt.logs
        .filter(log => log.address.toLowerCase() === traitsContract.toLowerCase() && log.topics[0] === transferEventSignature)
        .map(log => {
          if (!log.topics[3]) return 0;
          return Number(BigInt(log.topics[3]));
        });

      console.log('Minted Main Contract Token IDs:', mainContractTokens );
      console.log('Minted Trait Token IDs:', traitTokens);

      setMainContractTokens(mainContractTokens);
      setTraitTokens(traitTokens);
    }
  }, [isSuccess, receipt]);

  useEffect(() => {
    if (isError) {
      console.log('Transaction Error:', isError);
    }
  }, [isError]);

  return { 
    mint, 
    isPending,          
    isConfirming,       
    isSuccess,          
    isError,
    isRejected,            
    hash,
    receipt,
    mainContractTokens,
    traitTokens
  };
}

export function useMarketplaceActions(chonkId: number) {
  const { address } = useAccount();

  // Add this new hook to get the current bid
  const { data: chonkBidData } = useReadContract({
    address: marketplaceContract,
    abi: marketplaceABI,
    functionName: 'getChonkBid',
    args: [BigInt(chonkId)],
  }) as { data: [string, bigint, bigint[], string] }; // matches return types from contract

  // Convert array to object
  const chonkBid = useMemo(() => {
    if (!chonkBidData || chonkBidData[0] === '0x0000000000000000000000000000000000000000') return null;

    console.log('chonkBidData:', chonkBidData);
    return {
      bidder: chonkBidData[0],
      amountInWei: chonkBidData[1],
      traitIds: chonkBidData[2],
      encodedTraitIds: chonkBidData[3],
    };
  }, [chonkBidData]);

  const hasActiveBid = useMemo(() => {
    return Boolean(chonkBid);
  }, [chonkBid]);

  // Check if marketplace is approved
  const { data: isApproved } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: 'isApprovedForAll',
    args: [address, marketplaceContract],
  });

  // Approve marketplace contract
  const { writeContract: approveMarketplace } = useWriteContract();
  const handleApproveMarketplace = () => {
    if (!address) return;
    approveMarketplace({
      address: mainContract,
      abi: mainABI,
      functionName: 'setApprovalForAll',
      args: [marketplaceContract, true],
    });
  };

  // List chonk
  const { writeContract: listChonk } = useWriteContract();
  const handleListChonk = (priceInEth: string) => {
    if (!address || !chonkId) return;

    try {
      const priceInWei = parseEther(priceInEth);
      listChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'offerChonk',
        args: [BigInt(chonkId), priceInWei],
      });
    } catch (error) {
      console.error('Error listing chonk:', error);
    }
  };

  // List chonk to specific address
  const { writeContract: listChonkToAddress } = useWriteContract();
  const handleListChonkToAddress = (priceInEth: string, address: string) => {
    if (!address || !chonkId) return;

    try {
      const priceInWei = parseEther(priceInEth);
      listChonkToAddress({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'offerChonkToAddress',
        args: [BigInt(chonkId), priceInWei, address],
      });
    } catch (error) {
      console.error('Error listing chonk:', error);
    }
  };

  // cancel offer chonk
  const { writeContract: cancelOfferChonk } = useWriteContract();
  const handleCancelOfferChonk = () => {
    if (!address || !chonkId) return;
    cancelOfferChonk({
      address: marketplaceContract,
      abi: marketplaceABI,
      functionName: 'cancelOfferChonk',
      args: [BigInt(chonkId)],
    });
  };

  // cancel offer trait
  const { writeContract: cancelOfferTrait } = useWriteContract();
  const handleCancelOfferTrait = (traitId: number, chonkId: number) => {
    if (!address || !chonkId) return;
    cancelOfferTrait({
      address: marketplaceContract,
      abi: marketplaceABI,
      functionName: 'cancelOfferTrait',
      args: [BigInt(traitId), BigInt(chonkId)],
    });
  };


  // Buy chonk
  const { writeContract: buyChonk } = useWriteContract();
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
        onError: (error) => console.error('Transaction failed:', error)
      });
    } catch (error) {
      console.error('Error in handleBuyChonk:', error);
    }
  };

  // function bidOnChonk(
  //     uint256 _chonkId
  // ) public payable ensurePriceIsNotZero(msg.value) notPaused nonReentrant {
  //     address owner = PETERS_MAIN.ownerOf(_chonkId);
  //     if (owner == msg.sender) revert CantBidOnYourOwnChonk();

  //     ChonkBid memory existingBid = chonkBids[_chonkId];
  //     if (msg.value <= existingBid.amountInWei) revert BidIsTooLow();

  //     ( uint256[] memory traitIds , bytes memory encodedTraitIds ) = getTraitIdsAndEncodingForChonk(_chonkId);

  //     chonkBids[_chonkId] = ChonkBid(
  //         msg.sender,
  //         msg.value,
  //         traitIds,
  //         encodedTraitIds
  //     );

  //     if (existingBid.amountInWei > 0) {
  //         _refundBid(existingBid.bidder, existingBid.amountInWei);
  //     }

  //     emit ChonkBidEntered(_chonkId, msg.sender, msg.value);
  // }

  const { writeContract: bidOnChonk } = useWriteContract();
  const handleBidOnChonk = (chonkId: number, offerInEth: string) => {
    if (!address || !chonkId) return;

    try {
        const amountInWei = parseEther(offerInEth);
        bidOnChonk({
            address: marketplaceContract,
            abi: marketplaceABI,
            functionName: 'bidOnChonk',
            args: [BigInt(chonkId)],
            value: amountInWei
        });
    } catch (error) {
        console.error('Error placing bid:', error);
    }
  };

  // Add new hook for accepting bids
  const { writeContract: acceptBid } = useWriteContract();
  const handleAcceptBidForChonk = (bidder: string) => {
    if (!address || !chonkId) return;

    try {
      acceptBid({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'acceptBidForChonk',
        args: [BigInt(chonkId), bidder],
      });
    } catch (error) {
      console.error('Error accepting bid:', error);
    }
  };

  return {
    isApproved: !!isApproved,
    hasActiveBid,
    chonkBid,
    handleApproveMarketplace,
    handleListChonk,
    handleListChonkToAddress,
    handleBuyChonk,
    handleCancelOfferChonk,
    handleCancelOfferTrait,
    handleBidOnChonk,
    handleAcceptBidForChonk,
  };
}
