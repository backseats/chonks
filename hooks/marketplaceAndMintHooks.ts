import { useState, useEffect, useMemo } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAccount, useBalance } from "wagmi";
import { parseEther } from 'viem';
import { formatEther } from "viem";

import {
  mainContract,
  mainABI,
  traitsContract,
  marketplaceContract,
  traitsABI,
  marketplaceABI,
  chainId,
  MINT_PRICE,
} from "@/contract_data";
import { Chonk } from "@/types/Chonk";
import { Category } from "@/types/Category";


type ChonkOffer = {
  priceInWei: bigint;
  seller: string;
  sellerTBA: string;
  onlySellTo: string;
  encodedTraitIds: string;
}

// Temporarily here because /chonks/[id] is hidden in vercelignore
function decodeAndSetData(data: string, setData: (data: Chonk) => void) {
  const base64String = data.split(",")[1];
  const jsonString = atob(base64String);
  const jsonData = JSON.parse(jsonString) as Chonk;

  setData(jsonData);
}

export const categoryList = Object.values(Category);


  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  MINT Chonk  ////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

export function useMintFunction() {
  const { writeContract, isPending, data: hashMinting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isMintingSuccess, isError: isMintingError, data: receipt } = useWaitForTransactionReceipt({
    hash: hashMinting,
  });
  const [isMintRejected, setIsMintRejected] = useState(false);
  const [mainContractTokens, setMainContractTokens] = useState<number[]>();
  const [traitTokens, setTraitTokens] = useState<number[]>();

  const { address } = useAccount();
  // New hook to check user's balance on Base
  const { data: userBalance } = useBalance({
    address,
    chainId,
  });

  // console.log('userBalance', userBalance);

  const { data: totalSupply } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: 'totalSupply',
  });

  const mint = async (amount: number = 1, proof: string[] | null = null) => {
    if (amount < 1) throw new Error("Amount must be greater than 0");
    if (proof === null) proof = [];
    setIsMintRejected(false);

    try {
      const priceMap = {
        1: '0.01',
        2: '0.02',
        3: '0.03',
        4: '0.04',
        5: '0.05',
        6: '0.06',
        7: '0.07',
        8: '0.08',
        9: '0.09',
        10: '0.1'
      };
      const priceInWei = parseEther(priceMap[amount as keyof typeof priceMap]);
      const tx = await writeContract({
        address: mainContract,
        abi: mainABI,
        functionName: 'mint',
        args: [amount, proof],
        value: priceInWei,
        chainId,
      }, {
        onError: (error) => {
          console.log('Transaction rejected:', error);
          setIsMintRejected(true);
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
    if (isMintingSuccess && receipt) {
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
  }, [isMintingSuccess, receipt]);

  useEffect(() => {
    if (isMintingError) {
      console.log('Transaction Error:', isMintingError);
    }
  }, [isMintingError]);

  // Add new hook to check mint start time
  const { data: mintStartTime } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: 'initialMintStartTime',
  });

  // Calculate if mint is open and time remaining
  const mintStatus = useMemo(() => {

    // return { isOpen: false, timeRemaining: 0 }; // for testing

    if (!mintStartTime) return { isOpen: false, timeRemaining: 0 };

    const startTimeNum = Number(mintStartTime);
    if (startTimeNum === 0) return { isOpen: false, timeRemaining: 0 };

    const now = Math.floor(Date.now() / 1000);
    const endTime = startTimeNum + (24 * 60 * 60); // 24 hours in seconds
    const timeRemaining = endTime - now;

    console.log('timeRemaining', timeRemaining);

    return {
      isOpen: timeRemaining > 0,
      timeRemaining: timeRemaining //Math.max(0, timeRemaining)
    };
  }, [mintStartTime]);

  return {
    mint,
    isPending,
    isConfirming,
    isMintingSuccess,
    isMintingError,
    isMintRejected,
    hashMinting,
    receipt,
    mainContractTokens,
    traitTokens,
    totalSupply: totalSupply ? Number(totalSupply) : undefined,
    mintStatus,
    userBalance
  };
}

export function useMarketplaceActions(chonkId: number) {
  const { address } = useAccount();

  const [localApproved, setLocalApproved] = useState(false);
  const [pendingListPrice, setPendingListPrice] = useState<string | null>(null);

  const [isListingRejected, setIsListingRejected] = useState(false);
  const [isListingSuccess, setIsListingSuccess] = useState(false);

  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  Approve Marketplace  ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  // Check if marketplace is approved
  const { data: isApproved } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: 'isApprovedForAll',
    args: [address, marketplaceContract]
  });

  const finalIsApproved = isApproved || localApproved;

  // Approve marketplace contract
  const { writeContract: approveMarketplace, isPending: isApprovalPending, data: hashApproval } = useWriteContract();
  const { isLoading: isApprovalLoading, isSuccess: isApprovalSuccess, isError : isApprovalErrror, data: receiptApproval } = useWaitForTransactionReceipt({
    hash: hashApproval,
  });

  // const { writeContract: approveMarketplace } = useWriteContract();
  const handleApproveMarketplace = () => {
    if (!address) return;
    approveMarketplace({
      address: mainContract,
      abi: mainABI,
      functionName: 'setApprovalForAll',
      args: [marketplaceContract, true],
    });
  };

  useEffect(() => {
    if (isApprovalSuccess && receiptApproval) {
      // After successful approval transaction, update local state - we need this because useReadContract is not updated immediately and saves us having to check both isApproved and localApproved on page
      setLocalApproved(true);
    }
  }, [isApprovalSuccess, receiptApproval]);

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






  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  Get Offer Chonk  /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////


  //get Chonk Offers - accessing the offers directly from mapping
    // but we now have : getChonkOffer
  const { data: chonkOfferArray } = useReadContract({
      address: marketplaceContract,
      abi: marketplaceABI,
      functionName: "chonkOffers",
      args: [BigInt(chonkId)],
      chainId,
  }) as { data: [bigint, string, string, string, string] };

  // Convert array to object
  const chonkOffer: ChonkOffer | null = useMemo(() => {
      if (!chonkOfferArray) return null;
      return {
          priceInWei: chonkOfferArray[0],
          seller: chonkOfferArray[1],
          sellerTBA: chonkOfferArray[2],
          onlySellTo: chonkOfferArray[3],
          encodedTraitIds: chonkOfferArray[4],
      };
  }, [chonkOfferArray]);

  // Add this console log to see the raw response
  useEffect(() => {
      console.group("Raw Response");
      console.log("Raw chonkOffer:", chonkOffer);
      if (Array.isArray(chonkOffer)) {
          console.log("Is array, length:", chonkOffer.length);
          chonkOffer.forEach((item, index) => {
              console.log(`Item ${index}:`, item);
          });
      } else {
          console.log("Is not array, type:", typeof chonkOffer);
      }
      console.groupEnd();
  }, [chonkOffer]);

  const formattedPrice = useMemo(() => {
      if (!chonkOffer?.priceInWei) return null;
      console.log("Price in Wei before formatting:", chonkOffer.priceInWei);
      return parseFloat(formatEther(chonkOffer.priceInWei));
  }, [chonkOffer]);



  const isOfferSpecific = useMemo(() => {
      if (!chonkOffer?.onlySellTo) return false;
      return chonkOffer.onlySellTo !== "0x0000000000000000000000000000000000000000";
  }, [chonkOffer]);

  const canAcceptOffer = useMemo(() => {
      if (!chonkOffer?.onlySellTo || !address || !isOfferSpecific) return false;
      return chonkOffer.onlySellTo.toLowerCase() === address.toLowerCase();
  }, [chonkOffer, address, isOfferSpecific]);

  // Add these console logs
  useEffect(() => {
    console.log("Raw contract response:", chonkOffer);
    if (chonkOffer) {
        try {
            // Log each property individually
            console.group("Chonk Offer Details");
            if (chonkOffer.priceInWei) {
                console.log("Price in Wei:", chonkOffer.priceInWei.toString());
            } else {
                console.log("Price in Wei: undefined");
            }
            console.log("Seller:", chonkOffer.seller || "undefined");
            console.log("Seller TBA:", chonkOffer.sellerTBA || "undefined");
            console.log("Only sell to:", chonkOffer.onlySellTo || "undefined");
            console.log("Encoded trait IDs:", chonkOffer.encodedTraitIds || "undefined");
            console.groupEnd();

            if (address) {
                console.group("Wallet Info");
                console.log("Connected wallet:", address);
                console.log("Can accept offer:", chonkOffer.onlySellTo?.toLowerCase() === address.toLowerCase());
                console.groupEnd();
            }
        } catch (error) {
            console.error("Error accessing chonkOffer properties:", error);
            console.log("chonkOffer type:", typeof chonkOffer);
            console.log("chonkOffer keys:", Object.keys(chonkOffer));
        }
    } else {
        console.log("No offer found for this Chonk");
    }
}, [chonkOffer, address]);


const hasActiveOffer = useMemo(() => {
  return Boolean(chonkOffer && chonkOffer.priceInWei > 0n);
}, [chonkOffer]);


  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  List Chonk  ////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  // const { writeContract: listChonk } = useWriteContract();
  const { writeContract: listChonk, isPending: isListChonkPending, data: hashListChonk } = useWriteContract();
  const { isLoading: isListChonkLoading, isSuccess: isListChonkSuccess, isError : isListChonkError, data: receiptListChonk } = useWaitForTransactionReceipt({
    hash: hashListChonk,
  });

  const displayPrice = useMemo(() => {
    console.log('isListChonkSuccess:', isListChonkSuccess);
    if (isListChonkSuccess && pendingListPrice) {
      return parseFloat(pendingListPrice);
    }
    return formattedPrice;
  }, [formattedPrice, isListChonkSuccess, pendingListPrice]);

  const handleListChonk = (priceInEth: string) => {
    setIsListingRejected(false);
    if (!address || !chonkId) return;

    try {
      const priceInWei = parseEther(priceInEth);
      // Store the pending price
      setPendingListPrice(priceInEth);

      listChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'offerChonk',
        args: [BigInt(chonkId), priceInWei],
      }, {
        onError: (error) => {
          console.log('Listing transaction rejected:', error);
          setIsListingRejected(true);
          setPendingListPrice(null); // Clear pending price on error
        },
      });
    } catch (error) {
      console.error('Error listing chonk:', error);
      setPendingListPrice(null); // Clear pending price on error
    }
  };

  useEffect(() => {

    if (isListChonkSuccess) {
      console.log('isListChonkSuccess:', isListChonkSuccess);
      setIsListingSuccess(true);
    }
  }, [isListChonkSuccess]);


  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  List Chonk to Address  ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  // List chonk to specific address
  // const { writeContract: listChonkToAddress } = useWriteContract();
  const { writeContract: listChonkToAddress, isPending: isListChonkToAddressPending, data: hashListChonkToAddress } = useWriteContract();
  const { isLoading: isListChonkToAddressLoading, isSuccess: isListChonkToAddressSuccess, isError : isListChonkToAddressErrror, data: receiptListChonkToAddress } = useWaitForTransactionReceipt({
    hash: hashListChonkToAddress,
  });

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

  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  Cancel Offer Chonk  /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  // cancel offer chonk
  // const { writeContract: cancelOfferChonk } = useWriteContract();
  const { writeContract: cancelOfferChonk, isPending: isCancelOfferChonkPending, data: hashCancelOfferChonk } = useWriteContract();
  const { isLoading: isCancelOfferChonkLoading, isSuccess: isCancelOfferChonkSuccess, isError : isCancelOfferChonkErrror, data: receiptCancelOfferChonk } = useWaitForTransactionReceipt({
    hash: hashCancelOfferChonk,
  });

  const handleCancelOfferChonk = () => {
    if (!address || !chonkId) return;
    cancelOfferChonk({
      address: marketplaceContract,
      abi: marketplaceABI,
      functionName: 'cancelOfferChonk',
      args: [BigInt(chonkId)],
    });
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  Widthdraw Bid Chonk  /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  // cancel offer chonk
  // const { writeContract: cancelOfferChonk } = useWriteContract();
  const { writeContract: withdrawBidOnChonk, isPending: isWithdrawBidOnChonkPending, data: hashWithdrawBidOnChonk } = useWriteContract();
  const { isLoading: isWithdrawBidOnChonkLoading, isSuccess: isWithdrawBidOnChonkSuccess, isError : isWithdrawBidOnChonkErrror, data: receiptWithdrawBidOnChonk } = useWaitForTransactionReceipt({
    hash: hashWithdrawBidOnChonk,
  });

  const handleWithdrawBidOnChonk = () => {
    if (!address || !chonkId) return;
    withdrawBidOnChonk({
      address: marketplaceContract,
      abi: marketplaceABI,
      functionName: 'withdrawBidOnChonk',
      args: [BigInt(chonkId)],
    }, {
      onError: (error) => {
        console.log('Withdrawal transaction rejected:', error);
      },
    });
  };


  // listChonk({
  //   address: marketplaceContract,
  //   abi: marketplaceABI,
  //   functionName: 'offerChonk',
  //   args: [BigInt(chonkId), priceInWei],
  // }, {
  //   onError: (error) => {
  //     console.log('Listing transaction rejected:', error);
  //     setIsListingRejected(true);
  //     setPendingListPrice(null); // Clear pending price on error
  //   },
  // });

  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  Cancel Offer Trait  /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  // cancel offer trait
  // const { writeContract: cancelOfferTrait } = useWriteContract();
  const { writeContract: cancelOfferTrait, isPending: isCancelOfferTraitPending, data: hashCancelOfferTrait } = useWriteContract();
  const { isLoading: isCancelOfferTraitLoading, isSuccess: isCancelOfferTraitSuccess, isError : isCancelOfferTraitErrror, data: receiptCancelOfferTrait } = useWaitForTransactionReceipt({
    hash: hashCancelOfferTrait,
  });

  const handleCancelOfferTrait = (traitId: number, chonkId: number) => {
    if (!address || !chonkId) return;
    cancelOfferTrait({
      address: marketplaceContract,
      abi: marketplaceABI,
      functionName: 'cancelOfferTrait',
      args: [BigInt(traitId), BigInt(chonkId)],
    });
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  Buy Chonk  ////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////


  // Buy chonk
  // const { writeContract: buyChonk } = useWriteContract();
  const { writeContract: buyChonk, isPending: isBuyChonkPending, data: hashBuyChonk } = useWriteContract();
  const { isLoading: isBuyChonkLoading, isSuccess: isBuyChonkSuccess, isError : isBuyChonkErrror, data: receiptBuyChonk } = useWaitForTransactionReceipt({
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
        onError: (error) => console.error('Transaction failed:', error)
      });
    } catch (error) {
      console.error('Error in handleBuyChonk:', error);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  Bid on Chonk  /////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  // const { writeContract: bidOnChonk } = useWriteContract();
  const { writeContract: bidOnChonk, isPending: isBidOnChonkPending, data: hashBidOnChonk } = useWriteContract();
  const { isLoading: isBidOnChonkLoading, isSuccess: isBidOnChonkSuccess, isError : isBidOnChonkErrror, data: receiptBidOnChonk } = useWaitForTransactionReceipt({
    hash: hashBidOnChonk,
  });

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

  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  Accept Bid  ////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  // Add new hook for accepting bids
  // const { writeContract: acceptBid } = useWriteContract();
  const { writeContract: acceptBid, isPending: isAcceptBidPending, data: hashAcceptBid } = useWriteContract();
  const { isLoading: isAcceptBidLoading, isSuccess: isAcceptBidSuccess, isError : isAcceptBidErrror, data: receiptAcceptBid } = useWaitForTransactionReceipt({
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
      });
    } catch (error) {
      console.error('Error accepting bid:', error);
    }
  };

  return {
    // isPending,
    // isApproving,
    // isSuccess,
    // isError,
    // hash,
    // receipt,
    // isApproved: !!isApproved,
    finalIsApproved,
    hasActiveBid,
    hasActiveOffer,
    isOfferSpecific,
    canAcceptOffer,
    chonkBid,
    isListChonkLoading,
    isListingRejected,
    hashListChonk,
    isListChonkError,
    isListChonkSuccess,
    price: displayPrice,
    // priceUSD,
    handleApproveMarketplace,
    handleListChonk,
    handleListChonkToAddress,
    handleBuyChonk,
    handleCancelOfferChonk,
    handleCancelOfferTrait,
    handleBidOnChonk,
    handleAcceptBidForChonk,
    handleWithdrawBidOnChonk,

  };
}
