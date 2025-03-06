import { useState, useMemo, useEffect } from "react";
import { useMarketplaceActions } from "@/hooks/marketplaceAndMintHooks";
import { useBalance, useAccount, useEnsAddress } from "wagmi";
import { parseEther, isAddress, formatEther } from "viem";
import { mainnet } from "wagmi/chains";
import { ConnectKitButton } from "connectkit";
import { ModalWrapper } from './modals/ModalWrapper';
import { ListingModal } from './modals/ListingModal';
import { OfferModal } from './modals/OfferModal';
import { ActionButton } from './buttons/ActionButton';
import { MARKETPLACE_CONSTANTS } from '@/constants/marketplace';

type PriceAndActionsSectionProps = {
  chonkId: number;
  isOwner: boolean;
  // price: number | null;
  // priceUSD: number;
  // isOfferSpecific: boolean;
  // canAcceptOffer: boolean;

  // hasActiveOffer: boolean;
  // hasActiveBid: boolean;
  // onListingSuccess?: () => void;
  // chonkBid?: {
  //     bidder: string;
  //     amountInWei: bigint;
  //     traitIds: bigint[];
  //     encodedTraitIds: string;
  // } | null;
};

export default function PriceAndActionsSection(
  props: PriceAndActionsSectionProps
) {
  const { chonkId, isOwner } = props;

  const [dots, setDots] = useState("");
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listingPrice, setListingPrice] = useState("");
  const {
    finalIsApproved,
    isListingRejected,
    hashListChonk,
    hasActiveBid,
    chonkBid,
    hasActiveOffer,
    isOfferSpecific,
    canAcceptOffer,
    isListChonkPending,
    isListChonkError,
    isListChonkLoading,
    isListChonkSuccess,
    isCancelOfferChonkSuccess,
    price,
    handleApproveMarketplace,
    handleListChonk,
    handleListChonkToAddress,
    handleBuyChonk,
    handleCancelOfferChonk,
    handleBidOnChonk,
    handleAcceptBidForChonk,
    handleWithdrawBidOnChonk,
  } = useMarketplaceActions(chonkId);
  const [isPrivateListingExpanded, setIsPrivateListingExpanded] =
    useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");

  const [localListingSuccess, setLocalListingSuccess] = useState(false);
  const [localListingRejected, setLocalListingRejected] = useState(false);
  const [localListingPending, setLocalListingPending] = useState(false);
  const [localHashListChonk, setLocalHashListChonk] = useState(false);
  const [localCancelOfferChonkSuccess, setLocalCancelOfferChonkSuccess] = useState(false);

  const OFFER_PRICE_DECIMAL_PRECISION = 4;
  const MIN_LISTING_PRICE  = `0.${'0'.repeat(OFFER_PRICE_DECIMAL_PRECISION-1)}1`;
  const STEP_SIZE = MIN_LISTING_PRICE;

  useEffect(() => {
    if (isListChonkSuccess) {
      setLocalListingSuccess(true);
      setLocalCancelOfferChonkSuccess(false); // if it's successfully listed, we don't want to show the cancel offer button... can probably do this with some other effects below too
    }
  }, [isListChonkSuccess]);

  useEffect(() => {
    if (hashListChonk) {
      setLocalHashListChonk(true);
    }
  }, [hashListChonk]);

  useEffect(() => {
    if (isListingRejected) {
      setLocalListingRejected(true); // neeeded because we want to clear the rejection here
    }
  }, [isListingRejected]);

  useEffect(() => {
    if (isListChonkLoading) {
      setLocalListingPending(true); // neeeded because we want to clear the rejection here
    }
  }, [isListChonkLoading]);

  //isCancelOfferChonkSuccess
  useEffect(() => {
    if (isCancelOfferChonkSuccess) {
      setLocalCancelOfferChonkSuccess(true);
    }
  }, [isCancelOfferChonkSuccess]);

  // Calculate minimum offer (5% higher than current bid)
  const minimumOffer = useMemo(() => {
    if (hasActiveBid && chonkBid) {
      const currentBidEth = Number(formatEther(chonkBid.amountInWei));
      const fivePercentIncrease = currentBidEth * 0.05;

      // If 5% increase is smaller than our minimum precision step, use the step size instead
      if (fivePercentIncrease < Number(STEP_SIZE)) {
        return (currentBidEth + Number(STEP_SIZE)).toFixed(OFFER_PRICE_DECIMAL_PRECISION);
      }

      const minOffer = (currentBidEth * 1.05).toFixed(OFFER_PRICE_DECIMAL_PRECISION);
      return Number(minOffer).toString(); // Convert to number and back to string to remove trailing zeros
    } else {
      return MIN_LISTING_PRICE;
    }
  }, [hasActiveBid, chonkBid]);

  // let's initially set offerAmount to the minimum offer
  useEffect(() => {
    if (hasActiveBid && chonkBid && minimumOffer) {
      setOfferAmount(minimumOffer);
    }
  }, [hasActiveBid, chonkBid, minimumOffer]);

  // Add ENS resolution
  const { data: ensAddress } = useEnsAddress({
    name: recipientAddress.endsWith(".eth")
      ? recipientAddress.toLowerCase()
      : undefined,
    chainId: mainnet.id,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isModalOpen) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isModalOpen]);

  // Add logging
  // console.log('ENS Debug:', {
  //     input: recipientAddress,
  //     resolved: ensAddress,
  //     chainId: mainnet.id
  // });

  // Validate address helper
  const isValidAddress = useMemo(() => {
    if (!recipientAddress) return false;
    if (recipientAddress.endsWith(".eth")) return !!ensAddress;
    return isAddress(recipientAddress);
  }, [recipientAddress, ensAddress]);

  // Get final address for contract call
  const resolvedAddress = useMemo(() => {
    if (recipientAddress.endsWith(".eth")) return ensAddress;
    return isValidAddress ? recipientAddress : undefined;
  }, [recipientAddress, ensAddress, isValidAddress]);

  // Calculate if balance is sufficient (price + estimated gas)
  const estimatedGasInEth = 0.0002; // Rough estimate // Deploy: check what this could be set to!?
  const hasInsufficientBalance =
    price &&
    balance &&
    balance.value < parseEther((price + estimatedGasInEth).toString());




  // console.log('hasActiveOffer:', hasActiveOffer);
  // console.log('isListChonkSuccess:', isListChonkSuccess);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setListingPrice("");
    setRecipientAddress("");
    setPriceError("");
    setAddressError("");
    setLocalListingRejected(false);
    setLocalListingPending(false);
    setLocalHashListChonk(false);
  };

  const handleListingSubmit = () => {
    const listingPriceNum = Number(listingPrice);
    if (listingPriceNum < Number(MIN_LISTING_PRICE)) {
      setPriceError(`Minimum listing price is ${MIN_LISTING_PRICE} ETH`);
      return;
    }

    if (isPrivateListingExpanded && !resolvedAddress) {
      setAddressError("Please enter a valid address or ENS name");
      return;
    }

    if (isPrivateListingExpanded && resolvedAddress) {
      handleListChonkToAddress(listingPrice, resolvedAddress);
    } else {
      handleListChonk(listingPrice);
    }

    setLocalListingPending(true);
  };

  const handleOfferSubmit = () => {
    if (hasActiveBid && chonkBid && minimumOffer) {
      if (Number(offerAmount) < Number(minimumOffer)) {
        alert(`Your offer must be at least 5% higher than the current bid. Minimum offer: ${minimumOffer} ETH`);
        return;
      }
    }

    if (offerAmount) {
      handleBidOnChonk(chonkId, offerAmount);
    } else {
      alert('Please enter an amount, minimum offer: ' + minimumOffer + ' ETH');
      return;
    }
    setIsOfferModalOpen(false);
    setOfferAmount("");
  };

  const renderOwnerActions = () => (
    <div className="flex flex-col gap-2">
      <ActionButton
        variant="danger"
        onClick={handleCancelOfferChonk}
      >
        Cancel Listing
      </ActionButton>

      {hasActiveBid && chonkBid && (
        <ActionButton
          variant="primary"
          onClick={() => handleAcceptBidForChonk(chonkBid.bidder)}
        >
          Accept Offer of {formatEther(chonkBid.amountInWei)} ETH
        </ActionButton>
      )}
    </div>
  );

  const renderBuyerActions = () => (
    <div className="flex flex-col gap-2">
      <ActionButton
        variant="primary"
        disabled={Boolean((isOfferSpecific && !canAcceptOffer) || hasInsufficientBalance)}
        onClick={() => price && handleBuyChonk(price)}
      >
        {isOfferSpecific
          ? canAcceptOffer
            ? "Accept Private Offer"
            : "Private Offer - Not For You"
          : "Buy Now"}
      </ActionButton>

      {hasActiveBid && chonkBid && chonkBid.bidder === address ? (
        <ActionButton
          variant="danger"
          onClick={handleWithdrawBidOnChonk}
        >
          Cancel Your Offer
        </ActionButton>
      ) : (
        <ActionButton
          variant="secondary"
          onClick={() => setIsOfferModalOpen(true)}
        >
          Make an Offer
        </ActionButton>
      )}
    </div>
  );

  return (
    <>
      <div className="border border-black p-[1.725vw] mb-[1.725vw]">
        {/* Has Offer, or just been Listed */}
        {(hasActiveOffer || isListChonkSuccess) &&
        !localCancelOfferChonkSuccess ? (
          <>
            <div className="flex flex-col mb-4">
              <div className="flex items-baseline gap-2 mb-4">
                {isOwner ? (
                  <div className="text-xl">Chonk is Listed for</div>
                ) : (
                  <div className="text-xl">Buy this Chonk for</div>
                )}

                <span className="text-2xl font-bold">{price} ETH</span>
                {/* <span className="text-gray-500">(${priceUSD.toLocaleString()})</span> */}
              </div>
              {isOfferSpecific && (
                <span className="text-sm text-gray-500">Private Listing</span>
              )}
          </div>

            {!address ? (
              <ConnectKitButton
                // theme="web"
                customTheme={{
                  "--ck-font-family": "'Source Code Pro', monospace",
                  "--ck-primary-button-background": "#2F7BA7",
                  "--ck-primary-button-hover-background": "#FFFFFF",
                  "--ck-primary-button-hover-color": "#2F7BA7",
                  "--ck-primary-button-border-radius": "0px",
                  "--ck-primary-button-font-weight": "600",
                  "--ck-connectbutton-background": "#2F7BA7",
                  "--ck-connectbutton-hover-background": "#111111",
                  "--ck-connectbutton-hover-color": "#FFFFFF",
                  "--ck-connectbutton-border-radius": "0px",
                  "--ck-connectbutton-color": "#FFFFFF",
                  "--ck-connectbutton-font-weight": "600",
                  "--ck-connectbutton-font-size": "21px",
                }}
              />
            ) : isOwner ? (
              renderOwnerActions()
            ) : (
              <>
                {renderBuyerActions()}
              </>
            )}
          </>
        ) : (
          <>
            {/* Not Listed, or just been Cancelled */}

            <div className="text-[1vw] text-gray-500 mb-[1.725vw]">
              Not Listed
              {hasActiveBid && chonkBid && (
                <span className="text-gray-500">
                  {" "}
                  | Current Bid: {formatEther(chonkBid.amountInWei)} ETH
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {!address ? (
                <ConnectKitButton
                  // theme="web"
                  customTheme={{
                    "--ck-font-family": "'Source Code Pro', monospace",
                    "--ck-primary-button-background": "#2F7BA7",
                    "--ck-primary-button-hover-background": "#FFFFFF",
                    "--ck-primary-button-hover-color": "#2F7BA7",
                    "--ck-primary-button-border-radius": "0px",
                    "--ck-primary-button-font-weight": "600",
                    "--ck-connectbutton-background": "#2F7BA7",
                    "--ck-connectbutton-hover-background": "#111111",
                    "--ck-connectbutton-hover-color": "#FFFFFF",
                    "--ck-connectbutton-border-radius": "0px",
                    "--ck-connectbutton-color": "#FFFFFF",
                    "--ck-connectbutton-font-weight": "600",
                    "--ck-connectbutton-font-size": "21px",
                  }}
                />
              ) : isOwner || isCancelOfferChonkSuccess ? (
                <>
                  <button
                    className="w-full bg-chonk-blue text-white py-2 px-4 hover:brightness-110 transition-colors"
                    onClick={() => {
                      if (!finalIsApproved) {
                        handleApproveMarketplace();
                      } else {
                        setIsModalOpen(true);
                      }
                    }}
                  >
                    {finalIsApproved
                      ? "List Your Chonk"
                      : "Approve Marketplace to Trade"}
                  </button>

                  {finalIsApproved && hasActiveBid && chonkBid && (
                    <button
                      className="w-full bg-chonk-orange text-white py-2 px-4 hover:brightness-110 transition-colors"
                      onClick={() => handleAcceptBidForChonk(chonkBid.bidder)}
                    >
                      Accept Offer of {formatEther(chonkBid.amountInWei)} ETH
                    </button>
                  )}
                </>
              ) : (
                !isOwner && (
                  <>
                    {hasActiveBid && chonkBid && chonkBid.bidder === address ? (
                      <button
                        className="w-full bg-red-500 text-white py-2 px-4  hover:bg-red-600 transition-colors"
                        onClick={() => handleWithdrawBidOnChonk()}
                      >
                        Cancel Your Offer
                      </button>
                    ) : (
                      <button
                        className="w-full bg-chonk-blue text-white py-2 px-4  hover:bg-chonk-orange hover:text-black transition-colors"
                        onClick={() => setIsOfferModalOpen(true)}
                      >
                        Make an Offer
                      </button>
                    )}
                  </>
                )
              )}
            </div>
          </>
        )}
      </div>

      <ModalWrapper isOpen={isModalOpen} onClose={handleModalClose}>
        <ListingModal
          chonkId={chonkId}
          listingPrice={listingPrice}
          setListingPrice={setListingPrice}
          isPrivateListingExpanded={isPrivateListingExpanded}
          setIsPrivateListingExpanded={setIsPrivateListingExpanded}
          recipientAddress={recipientAddress}
          setRecipientAddress={setRecipientAddress}
          addressError={addressError}
          priceError={priceError}
          onSubmit={handleListingSubmit}
          onClose={handleModalClose}
          status={{
            isRejected: localListingRejected,
            isPending: localListingPending,
            isSuccess: localListingSuccess,
            hash: hashListChonk
          }}
        />
      </ModalWrapper>

      <ModalWrapper isOpen={isOfferModalOpen} onClose={() => setIsOfferModalOpen(false)}>
        <OfferModal
          chonkId={chonkId}
          offerAmount={offerAmount}
          setOfferAmount={setOfferAmount}
          minimumOffer={minimumOffer}
          hasActiveBid={hasActiveBid}
          currentBid={chonkBid}
          onSubmit={handleOfferSubmit}
          onClose={() => setIsOfferModalOpen(false)}
        />
      </ModalWrapper>
    </>
  );
}
