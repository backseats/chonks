import { useState, useEffect, useMemo } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAccount, useBalance } from "wagmi";
import { parseEther } from 'viem';
import { formatEther } from "viem";
import {
  mainContract,
  mainABI,
  marketplaceContract,
  marketplaceABI,
  chainId,
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

export const categoryList = Object.values(Category);

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
    try{
      approveMarketplace({
        address: mainContract,
        abi: mainABI,
        functionName: 'setApprovalForAll',
        args: [marketplaceContract, true],
      }, {
        onError: (error) => {
          console.log('Approval transaction rejected:', error);
          alert('Error approving marketplace: ' + error);
        },
      });
    } catch (error) {
      console.error('Error approving marketplace:', error);
      alert('Error approving marketplace: ' + error);
    }
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
    // console.log('isListChonkSuccess:', isListChonkSuccess);
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
          alert('Error listing chonk: ' + error.message);
          setIsListingRejected(true);
          setPendingListPrice(null); // Clear pending price on error
        },
      });
    } catch (error) {
      console.error('Error listing chonk:', error);
      alert('Error listing chonk: ' + error);
      setPendingListPrice(null); // Clear pending price on error
    }
  };

  // ML: 18.02.2025 - is setIsListingSuccess/isListChonkSuccess needed? i don't think so
  useEffect(() => {
    console.log('isListChonkSuccess useEffect:', isListChonkSuccess);
    if (isListChonkSuccess) {
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
      }, {
        onError: (error) => {
          console.log('Listing transaction rejected:', error);
          alert('Error listing chonk to address: ' + error.message);
        },
      });
    } catch (error) {
      console.error('Error listing chonk:', error);
      alert('Error listing chonk to address: ' + error);
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

    try{
      cancelOfferChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'cancelOfferChonk',
        args: [BigInt(chonkId)],
      }, {
        onError: (error) => {
          console.log('Cancel Offer Chonk transaction rejected:', error);
          alert(error.message);
          // TODO: probably need to notify user of error
        },
      });
    } catch (error) {
      console.error('Error canceling offer chonk:', error);
      alert('Error cancelling offer: ' + error);
    }
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
    try{
      withdrawBidOnChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
      functionName: 'withdrawBidOnChonk',
      args: [BigInt(chonkId)],
    }, {
      onError: (error) => {
        console.log('Withdrawal transaction rejected:', error);
        alert(error.message.includes('MustWaitToWithdrawBid') ? 'You must wait 100 seconds before cancelling your offer' : 'Error cancelling offer: ' + error.message);
        // alert(error.message);
      },
    });
    } catch (error) {
      console.error('Error withdrawing bid:', error);
      alert('Error withdrawing bid: ' + error);
    }
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
    try{
      cancelOfferTrait({
        address: marketplaceContract,
        abi: marketplaceABI,
      functionName: 'cancelOfferTrait',
      args: [BigInt(traitId), BigInt(chonkId)],
    }, {
      onError: (error) => {
        console.log('Cancel Offer Trait transaction rejected:', error);
        alert('Error cancelling offer trait: ' + error);
      },
      });
    } catch (error) {
      console.error('Error cancelling offer trait:', error);
      alert('Error cancelling offer trait: ' + error);
    }
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
        }, {
          onError: (error) => {
            console.error('Error placing bid:', error);
            alert('Error placing bid: ' + error);
          }
        });
    } catch (error) {
        console.error('Error placing bid:', error);
        alert('Error placing bid: ' + error);
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
    isCancelOfferChonkSuccess,
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
