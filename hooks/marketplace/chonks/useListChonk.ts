import { useState, useMemo } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { marketplaceContract, marketplaceABI, chainId } from "@/config";
import { parseEther, Address, zeroAddress, formatEther, getAddress } from "viem";

type ChonkOffer = {
  priceInWei: bigint;
  seller: string;
  sellerTBA: string;
  onlySellTo: string;
}

export default function useListChonk(address: Address | undefined, chonkId: number) {
  const [isListingRejected, setIsListingRejected] = useState(false);
  const [pendingListPrice, setPendingListPrice] = useState<string | null>(null);

  ////// Read //////

  const { data: chonkOfferArray, refetch: refetchChonkOffer } = useReadContract({
    address: marketplaceContract,
    abi: marketplaceABI,
    functionName: "chonkOffers",
    args: [BigInt(chonkId)],
    chainId,
  }) as { data: [bigint, string, string, string, string], refetch: () => Promise<any> };

  ////// Format //////

  // Converts the array to an object
  const chonkOffer: ChonkOffer | null = useMemo(() => {
    if (!chonkOfferArray) return null;
    return {
      priceInWei: chonkOfferArray[0],
      seller: chonkOfferArray[1],
      sellerTBA: chonkOfferArray[2],
      onlySellTo: chonkOfferArray[3],
    };
  }, [chonkOfferArray]);

  const formattedPrice = useMemo(() => {
    if (!chonkOffer?.priceInWei) return null;
    console.log("Price in Wei before formatting:", chonkOffer.priceInWei);
    return parseFloat(formatEther(chonkOffer.priceInWei));
  }, [chonkOffer]);

  const isOfferSpecific = useMemo(() => {
    if (!chonkOffer?.onlySellTo) return false;
    return chonkOffer.onlySellTo !== zeroAddress;
  }, [chonkOffer]);

  const canAcceptOffer = useMemo(() => {
    if (!chonkOffer?.onlySellTo || !address || !isOfferSpecific) return false;
    return getAddress(chonkOffer.onlySellTo) === getAddress(address);
  }, [chonkOffer, address, isOfferSpecific]);

  const hasActiveOffer = useMemo(() => {
    return Boolean(chonkOffer && chonkOffer.priceInWei > 0n);
  }, [chonkOffer]);

  //// Write ////

  const { writeContract: listChonk, isPending: isListChonkPending, isSuccess: isListChonkSuccess, isError: isListChonkError, data: listChonkHash } = useWriteContract();

  const { data: listChonkReceipt } = useWaitForTransactionReceipt({
    hash: listChonkHash,
    chainId,
  });

  const handleListChonk = (priceInEth: string, toAddress: string | null) => {
    setIsListingRejected(false);

    try {
      const priceInWei = parseEther(priceInEth);
      // Store the pending price
      setPendingListPrice(priceInEth);

      listChonk({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: toAddress ? 'offerChonkToAddress' : 'offerChonk',
        args: toAddress ? [BigInt(chonkId), priceInWei, toAddress] : [BigInt(chonkId), priceInWei],
        chainId,
      }, {
        onError: (error) => {
          console.log('Listing transaction rejected:', error);
          // TODO: rejected

          setIsListingRejected(true);
          setPendingListPrice(null);
        },
      });
    } catch (error) {
      console.error('Error listing chonk:', error);
      setPendingListPrice(null);
    }
  };

  const displayPrice = useMemo(() => {
    if (isListChonkSuccess && pendingListPrice) {
      return parseFloat(pendingListPrice);
    }

    return formattedPrice;
  }, [formattedPrice, isListChonkSuccess, pendingListPrice]);

  return {
    handleListChonk,
    isListingRejected,
    pendingListPrice,
    isListChonkPending,
    isListChonkSuccess,
    isListChonkError,
    price: displayPrice,
    isOfferSpecific, // is Offer only offered to specific address
    canAcceptOffer,
    hasActiveOffer,
    onlySellToAddress: chonkOffer?.onlySellTo,
    refetchChonkOffer,
    listChonkHash,
    listChonkReceipt,
  }
}
