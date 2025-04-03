import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { marketplaceContract, marketplaceABI, chainId } from "@/config";
import { Address, zeroAddress, formatEther, getAddress } from "viem";

type ChonkOffer = {
  priceInWei: bigint;
  seller: string;
  sellerTBA: string;
  onlySellTo: string;
}

export default function useGetChonkListing(address: Address | undefined, chonkId: number) {
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

  return {
    price: formattedPrice,
    isOfferSpecific, // is Offer only offered to specific address
    canAcceptOffer,
    hasActiveOffer,
    onlySellToAddress: chonkOffer?.onlySellTo,
    refetchChonkOffer,
  }
}
