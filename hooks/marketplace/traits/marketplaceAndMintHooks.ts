import { useState, useEffect, useMemo } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from 'viem';

import {
  mainContract,
  mainABI,
  traitsContract,
  marketplaceContract,
  traitsABI,
  marketplaceABI,
  chainId,
} from "@/config";
import { Category } from "@/types/Category";


type TraitOffer = {
  priceInWei: bigint;
  seller: string;
  sellerTBA: string;
  onlySellTo: string;
  // encodedTraitIds: string;
}


export const categoryList = Object.values(Category);

export function useMarketplaceActions(traitId: number) {
  const { address } = useAccount();

  const [localApproved, setLocalApproved] = useState(false);
  const [pendingListPrice, setPendingListPrice] = useState<string | null>(null);

  const [isListingRejected, setIsListingRejected] = useState(false);
  const [isListingSuccess, setIsListingSuccess] = useState(false);

  /// @dev Returns the token ids the end user's wallet owns
//   function walletOfOwner(address _owner) public view returns (uint256[] memory) {
//     uint256 tokenCount = balanceOf(_owner);

//     uint256[] memory tokensId = new uint256[](tokenCount);
//     for (uint256 i; i < tokenCount; ++i){
//         tokensId[i] = tokenOfOwnerByIndex(_owner, i);
//     }

//     return tokensId;
// }

  // const { data: walletOfOwnerData } = useReadContract({
  //   address: mainContract,
  //   abi: mainABI,
  //   functionName: 'walletOfOwner',
  //   args: [address],
  //   chainId,
  // }) as { data: bigint[] };


  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  Get Chonk Bid  ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////


  // Add this new hook to get the current bid
  const { data: traitBidData } = useReadContract({
    address: marketplaceContract,
    abi: marketplaceABI,
    functionName: 'getTraitBid',
    args: [BigInt(traitId)],
  }) as { data: [string, bigint, bigint, string] }; // matches return types from contract

  // Convert array to object
  const traitBid = useMemo(() => {
    if (!traitBidData || traitBidData[0] === '0x0000000000000000000000000000000000000000') return null;

    console.log('traitBidData:', traitBidData);
    return {
      bidder: traitBidData[0],
      bidderTBA: traitBidData[1],
      amountInWei: traitBidData[2],
      traitbidBlockNumberIds: traitBidData[3]
    };
  }, [traitBidData]);

  const hasActiveBid = useMemo(() => {
    return Boolean(traitBid);
  }, [traitBid]);


  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  Get Offer Chonk  /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////


  // get Trait Offers - accessing the offers directly from mapping
  // but we now have : getChonkOffer so probably should update to that TODO
  const { data: traitOfferArray } = useReadContract({
    address: marketplaceContract,
    abi: marketplaceABI,
    functionName: "traitOffers",
    args: [BigInt(traitId)],
    chainId,
  }) as { data: [bigint, string, string, string, string] };

  // Convert array to object
  const traitOffer: TraitOffer | null = useMemo(() => {
    if (!traitOfferArray) return null;
    return {
      priceInWei: traitOfferArray[0],
      seller: traitOfferArray[1],
      sellerTBA: traitOfferArray[2],
      onlySellTo: traitOfferArray[3],
    };
  }, [traitOfferArray]);

  // Add this console log to see the raw response
  useEffect(() => {
    console.group("Raw Response");
    console.log("Raw traitOffer:", traitOffer);
    if (Array.isArray(traitOffer)) {
      console.log("Is array, length:", traitOffer.length);
      traitOffer.forEach((item, index) => {
        console.log(`Item ${index}:`, item);
      });
    } else {
      console.log("Is not array, type:", typeof traitOffer);
    }
    console.groupEnd();
  }, [traitOffer]);

  const formattedPrice = useMemo(() => {
    if (!traitOffer?.priceInWei) return null;
    console.log("Price in Wei before formatting:", traitOffer.priceInWei);
    return parseFloat(formatEther(traitOffer.priceInWei));
  }, [traitOffer]);

  const isOfferSpecific = useMemo(() => {
    if (!traitOffer?.onlySellTo) return false;
    return traitOffer.onlySellTo !== "0x0000000000000000000000000000000000000000";
  }, [traitOffer]);

  const canAcceptOffer = useMemo(() => {
    if (!traitOffer?.onlySellTo || !address || !isOfferSpecific) return false;
    return traitOffer.onlySellTo.toLowerCase() === address.toLowerCase();
  }, [traitOffer, address, isOfferSpecific]);

  // Add these console logs
  useEffect(() => {
    console.log("Raw contract response:", traitOffer);
    if (traitOffer) {
      try {
        // Log each property individually
        console.group("Trait Offer Details");
        if (traitOffer.priceInWei) {
          console.log("Price in Wei:", traitOffer.priceInWei.toString());
        } else {
          console.log("Price in Wei: undefined");
        }
        console.log("Seller:", traitOffer.seller || "undefined");
        console.log("Seller TBA:", traitOffer.sellerTBA || "undefined");
        console.log("Only sell to:", traitOffer.onlySellTo || "undefined");
        // console.log("Encoded trait IDs:", traitOffer.encodedTraitIds || "undefined");
        console.groupEnd();

        if (address) {
          console.group("Wallet Info");
          console.log("Connected wallet:", address);
          console.log("Can accept offer:", traitOffer.onlySellTo?.toLowerCase() === address.toLowerCase());
          console.groupEnd();
        }
      } catch (error) {
        console.error("Error accessing traitOffer properties:", error);
        console.log("traitOffer type:", typeof traitOffer);
        console.log("traitOffer keys:", Object.keys(traitOffer));
      }
    } else {
      console.log("No offer found for this Trait");
    }
  }, [traitOffer, address]);


  const hasActiveOffer = useMemo(() => {
    return Boolean(traitOffer && traitOffer.priceInWei > 0n);
  }, [traitOffer]);


    ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  List Trait  ////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  const { writeContract: listTrait, isPending: isListTraitPending, data: hashListTrait } = useWriteContract();
  const { isLoading: isListTraitLoading, isSuccess: isListTraitSuccess, isError : isListTraitError, data: receiptListTrait } = useWaitForTransactionReceipt({
    hash: hashListTrait,
  });

  const displayPrice = useMemo(() => {
    // console.log('isListChonkSuccess:', isListChonkSuccess);
    if (isListTraitSuccess && pendingListPrice) {
      return parseFloat(pendingListPrice);
    }
    return formattedPrice;
  }, [formattedPrice, isListTraitSuccess, pendingListPrice]);

  const handleListTrait = (priceInEth: string, chonkId: number) => {
    console.log('handleListTrait', { priceInEth, traitId, address, chonkId });

    if (!address || !traitId || chonkId === 0) return;

    try {
      const priceInWei = parseEther(priceInEth);
      listTrait({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'offerTrait',
        args: [BigInt(traitId), BigInt(chonkId), priceInWei],
        chainId,
      }, {
        onError: (error) => {
          console.error('Contract revert:', error);
          // You can parse the error message to handle specific revert reasons
          const errorMessage = (error as Error).message;
          if (errorMessage.includes('NotYourTrait')) {
            console.error('You do not own this trait');
          } else if (errorMessage.includes('TraitEquipped')) {
            alert('Please unequip the trait before selling');
            console.error('Please unequip the trait before selling');
          }
        },
        onSuccess: (data) => {
          console.log('Transaction submitted:', data);
        }
      });
    } catch (error) {
      console.error('Error listing trait:', error);
    }
  };

  // List trait to specific address
  const { writeContract: listTraitToAddress } = useWriteContract();
  const handleListTraitToAddress = (priceInEth: string,  chonkId: number, address: string) => {
    if (!address || !traitId) return;

    try {
      const priceInWei = parseEther(priceInEth);
      listTraitToAddress({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'offerTraitToAddress',
        args: [BigInt(traitId), BigInt(chonkId), priceInWei, address],
        chainId,
      }, {
        onError: (error) => {
          console.error('Contract revert:', error);
          // You can parse the error message to handle specific revert reasons
          const errorMessage = (error as Error).message;
          if (errorMessage.includes('NotYourTrait')) {
            console.error('You do not own this trait');
          } else if (errorMessage.includes('TraitEquipped')) {
            alert('Please unequip the trait before selling');
            console.error('Please unequip the trait before selling');
          }
        },
        onSuccess: (data) => {
          console.log('Transaction submitted:', data);
        }
      });
    } catch (error) {
      console.error('Error listing trait:', error);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  Widthdraw Bid Chonk  /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  const { writeContract: withdrawBidOnTrait, isPending: isWithdrawBidOnTraitPending, data: hashWithdrawBidOnTrait } = useWriteContract();
  const { isLoading: isWithdrawBidOnTraitLoading, isSuccess: isWithdrawBidOnTraitSuccess, isError: isWithdrawBidOnTraitErrror, data: receiptWithdrawBidOnTrait } = useWaitForTransactionReceipt({
    hash: hashWithdrawBidOnTrait,
  });

  const handleWithdrawBidOnTrait = () => {
    if (!address || !traitId) return;
    try {
      withdrawBidOnTrait({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'withdrawBidOnTrait',
        args: [BigInt(traitId)],
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


    ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  cancel offer trait  /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  // cancel offer trait
  const { writeContract: cancelOfferTrait } = useWriteContract();
  const handleCancelOfferTrait = (chonkId: number) => {
    console.log('handleCancelOfferTrait', { traitId, chonkId });
    if (!address || !traitId || chonkId === 0) return;

    cancelOfferTrait({
      address: marketplaceContract,
      abi: marketplaceABI,
      functionName: 'cancelOfferTrait',
      args: [BigInt(traitId), BigInt(chonkId)],
      chainId,
    });
  };


  // Buy chonk
  const { writeContract: buyChonk } = useWriteContract();
  const handleBuyChonk = (priceInEth: number) => {
    if (!address || !traitId) {
      console.log('Early return - missing address or traitId:', { address, traitId });
      return;
    }

    try {
      console.log('Attempting to buy chonk:', { traitId, priceInEth });
      const priceInWei = parseEther(priceInEth.toString());
      console.log('Price in Wei:', priceInWei);

      buyChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'buyChonk',
        args: [BigInt(traitId)],
        value: priceInWei,
        chainId,
      }, {
        onSuccess: (data) => console.log('Transaction submitted:', data),
        onError: (error) => console.error('Transaction failed:', error)
      });
    } catch (error) {
      console.error('Error in handleBuyChonk:', error);
    }
  };

  // Buy trait
  const { writeContract: buyTrait } = useWriteContract();
  const handleBuyTrait = (priceInEth: number, chonkId: number) => {

    console.log('handleBuyTrait', { priceInEth, traitId, address, chonkId });
    if (!address || !traitId || chonkId === 0) {
      console.log('Early return - missing address or traitId:', { address, traitId, chonkId });
      return;
    }

    // temp solution to just give it to the first chonk in wallet

    // chonkId = Number(walletOfOwnerData?.[0] ?? 0);


    try {
      console.log('Attempting to buy trait:', { traitId, priceInEth, chonkId });
      const priceInWei = parseEther(priceInEth.toString());
      console.log('Price in Wei:', priceInWei);

      buyTrait({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'buyTrait',
        args: [BigInt(traitId), BigInt(chonkId)],
        value: priceInWei,
        chainId,
      }, {
        onSuccess: (data) => console.log('Transaction submitted:', data),
        onError: (error) => console.error('Transaction failed:', error)
      });
    } catch (error) {
      console.error('Error in handleTraitChonk:', error);
    }
  };

  // function bidOnChonk(
  //     uint256 _chonkId
  // ) public payable ensurePriceIsNotZero(msg.value) notPaused nonReentrant {
  //     address owner = CHONKS_MAIN.ownerOf(_chonkId);
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

  const { writeContract: bidOnTrait } = useWriteContract();
  const handleBidOnTrait = (traitId: number, chonkId: number, offerInEth: string,) => {
    if (!address || !traitId || chonkId === 0 || !offerInEth) {
      console.log('Early return - missing address or traitId:', { address, traitId, chonkId, offerInEth });
      return;
    }

    console.log('handleBidOnTrait', { traitId, chonkId, offerInEth });

    try {
        const amountInWei = parseEther(offerInEth);
        bidOnTrait({
            address: marketplaceContract,
            abi: marketplaceABI,
            functionName: 'bidOnTrait',
            args: [BigInt(traitId), BigInt(chonkId)],
            value: amountInWei,
            chainId,
        }, {
            onSuccess: (data) => console.log('Transaction submitted:', data),
            onError: (error) => console.error('Transaction failed:', error)
        });
    } catch (error) {
        console.error('Error placing bid:', error);
    }
  };


  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  Accept Bid  ////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  // Add new hook for accepting bids
  const { writeContract: acceptBid, isPending: isAcceptBidPending, data: hashAcceptBid } = useWriteContract();
  const { isLoading: isAcceptBidLoading, isSuccess: isAcceptBidSuccess, isError: isAcceptBidErrror, data: receiptAcceptBid } = useWaitForTransactionReceipt({
    hash: hashAcceptBid,
  });

  const handleAcceptBidForTrait = (bidder: string) => {
    if (!address || !traitId) return;

    try {
      acceptBid({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: 'acceptBidForTrait',
        args: [BigInt(traitId), bidder],
        chainId,
      });
    } catch (error) {
      console.error('Error accepting bid:', error);
    }
  };


  ///////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////  RETURN ////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////

  return {
    hasActiveBid,
    traitBid,
    price: displayPrice,
    hasActiveOffer,
    isOfferSpecific,
    canAcceptOffer,
    handleListTrait,
    handleListTraitToAddress,
    handleBuyChonk,
    handleBuyTrait,
    handleCancelOfferTrait,
    handleBidOnTrait,
    handleAcceptBidForTrait,
    handleWithdrawBidOnTrait,
  };
}
