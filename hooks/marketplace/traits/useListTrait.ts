import { useState, useMemo } from "react";
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { marketplaceContract, marketplaceABI, chainId } from "@/config";
import { parseEther, Address, zeroAddress, formatEther, getAddress } from "viem";

type TraitOffer = {
  priceInWei: bigint;
  seller: string;
  sellerTBA: string;
  onlySellTo: string;
}

export default function useListTrait(address: Address | undefined, traitId: number) {
  const [isListingRejected, setIsListingRejected] = useState(false);
  const [pendingListPrice, setPendingListPrice] = useState<string | null>(null);

  ////// Read //////

  const { data: traitOfferArray } = useReadContract({
    address: marketplaceContract,
    abi: marketplaceABI,
    functionName: "traitOffers",
    args: [BigInt(traitId)],
    chainId,
  }) as { data: [bigint, string, string, string, string] };

  ////// Format //////

  // Converts the array to an object
  const traitOffer: TraitOffer | null = useMemo(() => {
    if (!traitOfferArray) return null;
    return {
      priceInWei: traitOfferArray[0],
      seller: traitOfferArray[1],
      sellerTBA: traitOfferArray[2],
      onlySellTo: traitOfferArray[3],
    };
  }, [traitOfferArray]);

  const formattedPrice = useMemo(() => {
    if (!traitOffer?.priceInWei) return null;
    return parseFloat(formatEther(traitOffer.priceInWei));
  }, [traitOffer]);

  const isOfferSpecific = useMemo(() => {
    if (!traitOffer?.onlySellTo) return false;
    return traitOffer.onlySellTo !== zeroAddress;
  }, [traitOffer]);

  const canAcceptOffer = useMemo(() => {
    if (!traitOffer?.onlySellTo || !address || !isOfferSpecific) return false;
    return getAddress(traitOffer.onlySellTo) === getAddress(address);
  }, [traitOffer, address, isOfferSpecific]);

  const hasActiveOffer = useMemo(() => {
    return Boolean(traitOffer && traitOffer.priceInWei > 0n);
  }, [traitOffer]);

  //// Write ////

  const { writeContract: listTrait, isPending: isListTraitPending, data: hashListTrait } = useWriteContract();
  const { isLoading: isListTraitLoading, isSuccess: isListTraitSuccess, isError: isListTraitError } = useWaitForTransactionReceipt({
    hash: hashListTrait,
  });

  // Combined function that handles both regular and address-specific listings
  const handleListTrait = (priceInEth: string, chonkId: number, toAddress: string | null = null) => {
    setIsListingRejected(false);
    if (!address || !traitId || chonkId === 0) return;

    try {
      const priceInWei = parseEther(priceInEth);
      // Store the pending price
      setPendingListPrice(priceInEth);

      listTrait({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: toAddress ? 'offerTraitToAddress' : 'offerTrait',
        args: toAddress
          ? [BigInt(traitId), BigInt(chonkId), priceInWei, toAddress]
          : [BigInt(traitId), BigInt(chonkId), priceInWei],
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

          setIsListingRejected(true);
          setPendingListPrice(null);
        },
        onSuccess: (data) => {
          console.log('Transaction submitted:', data);
        }
      });
    } catch (error) {
      console.error('Error listing trait:', error);
      alert('Error listing trait: ' + error);
      setPendingListPrice(null); // Clear pending price on error
    }
  };

  const displayPrice = useMemo(() => {
    if (isListTraitSuccess && pendingListPrice) {
      return parseFloat(pendingListPrice);
    }
    return formattedPrice;
  }, [formattedPrice, isListTraitSuccess, pendingListPrice]);

  // String error state
  const listTraitError = isListTraitError ? "Failed to list trait. Please try again." : "";

  return {
    handleListTrait,
    isListTraitPending,
    isListTraitSuccess,
    isListingRejected,
    listTraitError,
    price: displayPrice,
    hasActiveOffer,
    isOfferSpecific,
    canAcceptOffer,
    onlySellToAddress: traitOffer?.onlySellTo,
  };
}
