import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { marketplaceContract, marketplaceABI, chainId } from "@/config";
import { formatEther, getAddress, zeroAddress, Address } from "viem";

type TraitOffer = {
  priceInWei: bigint;
  seller: string;
  sellerTBA: string;
  onlySellTo: string;
}

export default function useGetTraitListing(address: Address | undefined, traitId: number) {
  const { data: traitOfferArray, refetch: refetchTraitListing } = useReadContract({
    address: marketplaceContract,
    abi: marketplaceABI,
    functionName: "traitOffers",
    args: [BigInt(traitId)],
    chainId,
  }) as { data: [bigint, string, string, string, string], refetch: () => void };

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

  return {
    price: formattedPrice,
    hasActiveOffer,
    isOfferSpecific,
    canAcceptOffer,
    onlySellToAddress: traitOffer?.onlySellTo,
    refetchTraitListing,
  };
}
