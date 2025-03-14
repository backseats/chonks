import { useState, useMemo, useEffect } from "react";
import { useBalance, useAccount, useEnsAddress, useFeeData } from "wagmi";
import { parseEther, isAddress, formatEther, getAddress } from "viem";
import { mainnet } from "wagmi/chains";
import { ModalWrapper } from "./modals/ModalWrapper";
import { ListingModal } from "./modals/ListingModal";
import { OfferModal } from "./modals/OfferModal";
import { ActionButton } from "./buttons/ActionButton";
import MarketplaceConnectKitButton from "../common/MarketplaceConnectKitButton";
import CurrentBid from "../common/CurrentBid";
import AcceptOfferButton from "../common/AcceptOfferButton";
import MakeCancelOfferButton from "../common/MakeCancelOfferButton";
import ListOrApproveButton from "../common/ListOrApproveButton";
import { truncateEthAddress } from "@/utils/truncateEthAddress";

import useAcceptChonkBid from "@/hooks/marketplace/chonks/useAcceptChonkBid";
import useApproval from "@/hooks/marketplace/chonks/useApproval";
import useCancelOffer from "@/hooks/marketplace/chonks/useCancelOffer";
import useGetChonkBid from "@/hooks/marketplace/chonks/useGetChonkBid";
import useListChonk from "@/hooks/marketplace/chonks/useListChonk";
import useBidOnChonk from "@/hooks/marketplace/chonks/useBidOnChonk";
import useWithdrawChonkBid from "@/hooks/marketplace/chonks/useWithdrawChonkBid";
import useBuyChonk from "@/hooks/marketplace/chonks/useBuyChonk";

export default function PriceAndActionsSection({
  chonkId,
  isOwner,
}: {
  chonkId: number;
  isOwner: boolean;
}) {
  const [dots, setDots] = useState("");
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listingPrice, setListingPrice] = useState("");

  //// Hooks ////

  const {
    canAcceptOffer,
    handleListChonk,
    hasActiveOffer,
    isListChonkPending,
    isListChonkSuccess,
    isListingRejected,
    isOfferSpecific,
    onlySellToAddress,
    price,
  } = useListChonk(address, chonkId);

  const {
    finalIsApproved,
    handleApproveMarketplace,
    isApprovalPending,
    approvalError,
  } = useApproval(address);

  const {
    handleCancelOfferChonk,
    isCancelOfferChonkPending,
    isCancelOfferChonkSuccess,
    isCancelOfferChonkRejected,
  } = useCancelOffer(address, chonkId);

  const {
    handleBidOnChonk,
    isBidOnChonkPending,
    isBidOnChonkSuccess,
    isBidOnChonkError,
  } = useBidOnChonk(chonkId);

  const { chonkBid, hasActiveBid, refetchChonkBid } = useGetChonkBid(chonkId);

  const {
    handleWithdrawBidOnChonk,
    isWithdrawBidOnChonkPending,
    isWithdrawBidOnChonkSuccess,
    isWithdrawBidOnChonkError,
    withdrawBidOnChonkError,
  } = useWithdrawChonkBid(chonkId);

  const {
    handleBuyChonk,
    isBuyChonkPending,
    isBuyChonkSuccess,
    isBuyChonkError,
    buyChonkError,
  } = useBuyChonk(chonkId);

  const {
    handleAcceptBidForChonk,
    isAcceptBidPending,
    isAcceptBidSuccess,
    isAcceptBidError,
    acceptBidError,
  } = useAcceptChonkBid(chonkId);

  ////////////////////////////////////////////////////////////

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

  const [localCancelOfferChonkPending, setLocalCancelOfferChonkPending] =
    useState(false);
  const [localCancelOfferChonkSuccess, setLocalCancelOfferChonkSuccess] =
    useState(false);

  const [localBidOnChonkPending, setLocalBidOnChonkPending] = useState(false);
  const [localBidOnChonkError, setLocalBidOnChonkError] = useState(false);

  const OFFER_PRICE_DECIMAL_PRECISION = 4;
  const MIN_LISTING_PRICE = `0.${"0".repeat(
    OFFER_PRICE_DECIMAL_PRECISION - 1
  )}1`;
  const STEP_SIZE = MIN_LISTING_PRICE;

  useEffect(() => {
    if (isListChonkSuccess) {
      setLocalListingSuccess(true);
      setLocalCancelOfferChonkSuccess(false);
    }
  }, [isListChonkSuccess]);

  useEffect(() => {
    if (isListingRejected) {
      setLocalListingRejected(true); // needed because we want to clear the rejection here
    }
  }, [isListingRejected]);

  useEffect(() => {
    if (isCancelOfferChonkRejected) {
      setLocalCancelOfferChonkPending(false);
      setLocalCancelOfferChonkSuccess(false);
      return;
    }

    if (isCancelOfferChonkPending) {
      setLocalCancelOfferChonkPending(true);
      return;
    }

    if (isCancelOfferChonkSuccess) {
      setLocalCancelOfferChonkPending(false);
      setLocalCancelOfferChonkSuccess(true);
      return;
    }
  }, [
    isCancelOfferChonkPending,
    isCancelOfferChonkSuccess,
    isCancelOfferChonkRejected,
  ]);

  useEffect(() => {
    if (isOfferModalOpen && hasActiveBid) {
      setIsOfferModalOpen(false);
    }
  }, [isOfferModalOpen, hasActiveBid]);

  useEffect(() => {
    if (isBidOnChonkPending) {
      setLocalBidOnChonkPending(true);
      return;
    }

    if (isBidOnChonkSuccess) {
      setLocalBidOnChonkPending(false);
      handleBidModalClose();
      setOfferAmount("");

      setTimeout(() => refetchChonkBid(), 3000);
      return;
    }

    if (isBidOnChonkError) {
      setLocalBidOnChonkPending(false);
      setLocalBidOnChonkError(true);
      return;
    }
  }, [isBidOnChonkPending, isBidOnChonkSuccess, isBidOnChonkError]);

  // Reload after a buy
  useEffect(() => {
    if (isBuyChonkSuccess) window.location.reload();
  }, [isBuyChonkSuccess]);

  // Reload after an accept/buy
  useEffect(() => {
    if (isAcceptBidSuccess) window.location.reload();
  }, [isAcceptBidSuccess]);

  useEffect(() => {
    if (isWithdrawBidOnChonkSuccess) {
      refetchChonkBid();
      setOfferAmount("");
    }
  }, [isWithdrawBidOnChonkSuccess]);

  // Calculate minimum offer (5% higher than current bid)
  const minimumOffer = useMemo(() => {
    if (hasActiveBid && chonkBid) {
      const currentBidEth = Number(formatEther(chonkBid.amountInWei));
      const fivePercentIncrease = currentBidEth * 0.05;

      // If 5% increase is smaller than our minimum precision step, use the step size instead
      if (fivePercentIncrease < Number(STEP_SIZE)) {
        return (currentBidEth + Number(STEP_SIZE)).toFixed(
          OFFER_PRICE_DECIMAL_PRECISION
        );
      }

      const minOffer = (currentBidEth * 1.05).toFixed(
        OFFER_PRICE_DECIMAL_PRECISION
      );
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
      : "",
    chainId: mainnet.id,
  });

  // console.log("ensDebug:", {
  //   resolved: ensAddress,
  // });

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
    return isValidAddress ? recipientAddress : "";
  }, [recipientAddress, ensAddress, isValidAddress]);

  // Calculate if balance is sufficient (price + estimated gas)
  const estimatedGasInEth = 0.0002; // Rough estimate // Deploy: check what this could be set to!?
  const hasInsufficientBalance =
    price &&
    balance &&
    balance.value < parseEther((price + estimatedGasInEth).toString());

  const handleModalClose = () => {
    setIsModalOpen(false);
    setListingPrice("");
    setRecipientAddress("");
    setPriceError("");
    setAddressError("");
    setLocalListingRejected(false);
    setLocalListingPending(false);
    setLocalListingSuccess(false);
    setIsPrivateListingExpanded(false);
  };

  const handleBidModalClose = () => {
    setPriceError("");
    setOfferAmount("");
    setIsOfferModalOpen(false);
    setLocalBidOnChonkPending(false);
    setLocalBidOnChonkError(false);
  };

  const handleListingSubmit = () => {
    const listingPriceNum = Number(listingPrice);
    if (listingPriceNum < Number(MIN_LISTING_PRICE)) {
      setPriceError(`Minimum listing price is ${MIN_LISTING_PRICE} ETH`);
      return;
    }

    if (isPrivateListingExpanded) {
      if (resolvedAddress !== "" && !resolvedAddress) {
        setAddressError("Please enter a valid address or ENS name");
        return;
      }
    }

    if (isPrivateListingExpanded && resolvedAddress) {
      handleListChonk(listingPrice, resolvedAddress);
    } else {
      handleListChonk(listingPrice, null);
    }

    setLocalListingPending(true);
  };

  const handleOfferSubmit = () => {
    // const clear = () => {
    //   setIsOfferModalOpen(false);
    //   setOfferAmount("");
    // };

    if (hasActiveBid && chonkBid && minimumOffer) {
      if (Number(offerAmount) < Number(minimumOffer)) {
        alert(
          `Your offer must be at least 5% higher than the current bid. Minimum offer: ${minimumOffer} ETH`
        );
        return;
      }
    }

    if (offerAmount) {
      handleBidOnChonk(offerAmount);
    } else {
      setPriceError("Enter a minimum offer of " + minimumOffer + " ETH");
      return;
    }

    // clear();
  };

  const renderOwnerActions = () => (
    <div className="flex flex-col gap-2">
      <ActionButton
        variant="danger"
        onClick={handleCancelOfferChonk}
        disabled={localCancelOfferChonkPending && !isCancelOfferChonkSuccess}
      >
        {localCancelOfferChonkPending && !isCancelOfferChonkSuccess
          ? "Confirm with your wallet"
          : "Cancel Listing"}
      </ActionButton>
    </div>
  );

  const renderBuyerActions = () => (
    <div className="flex flex-col gap-2">
      <ActionButton
        variant="primary"
        disabled={Boolean(
          (isOfferSpecific && !canAcceptOffer) ||
            hasInsufficientBalance ||
            isBuyChonkPending
        )}
        onClick={() => price && handleBuyChonk(price)}
      >
        {isOfferSpecific
          ? canAcceptOffer
            ? "Buy Now"
            : "This Offer is Private"
          : "Buy Now"}
      </ActionButton>

      {buyChonkError && !isBuyChonkPending && (
        <div className="text-red-500 text-sm">{buyChonkError}</div>
      )}

      {hasActiveBid &&
      chonkBid &&
      chonkBid.bidder === address &&
      !isWithdrawBidOnChonkSuccess ? (
        <>
          <ActionButton
            variant="danger"
            onClick={handleWithdrawBidOnChonk}
            disabled={isWithdrawBidOnChonkPending}
          >
            Cancel Your Offer
          </ActionButton>

          {withdrawBidOnChonkError && !isWithdrawBidOnChonkPending && (
            <div className="text-red-500 text-sm">
              {withdrawBidOnChonkError}
            </div>
          )}
        </>
      ) : (
        <ActionButton
          variant="secondary"
          onClick={() => {
            setPriceError("");
            setIsOfferModalOpen(true);
          }}
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
              <div className="flex items-baseline gap-2">
                <div className="text-xl">
                  {isOwner ? `Listed for` : `Buy Chonk #${chonkId} now for`}
                </div>

                <span className="text-2xl font-bold">{price} ETH</span>
                {/* <span className="text-gray-500">(${priceUSD.toLocaleString()})</span> */}
              </div>

              {isOfferSpecific && (
                <span className="text-sm text-gray-500 mb-4 mt-1">
                  Private Listing for{" "}
                  {onlySellToAddress &&
                  address &&
                  getAddress(onlySellToAddress) === getAddress(address)
                    ? "You"
                    : truncateEthAddress(onlySellToAddress)}
                </span>
              )}

              {hasActiveBid && chonkBid && !isWithdrawBidOnChonkSuccess && (
                <div className="text-xl">
                  Your Offer: {formatEther(chonkBid.amountInWei)} ETH
                </div>
              )}
            </div>

            {!address ? (
              <MarketplaceConnectKitButton />
            ) : isOwner ? (
              renderOwnerActions()
            ) : (
              <>{renderBuyerActions()}</>
            )}
          </>
        ) : (
          <>
            {hasActiveBid && chonkBid && (
              <CurrentBid
                amountInWei={chonkBid.amountInWei}
                bidder={chonkBid.bidder}
                address={address}
              />
            )}

            <div className="flex flex-col gap-2">
              {!address ? (
                <MarketplaceConnectKitButton />
              ) : isOwner ||
                isCancelOfferChonkSuccess ||
                localCancelOfferChonkSuccess ? (
                <>
                  <ListOrApproveButton
                    isApprovalPending={isApprovalPending}
                    finalIsApproved={finalIsApproved}
                    handleApproveMarketplace={handleApproveMarketplace}
                    setIsModalOpen={setIsModalOpen}
                    approvalError={approvalError ?? null}
                    hasActiveBid={hasActiveBid}
                    isEquipped={false}
                    handleUnequipTrait={() => {}}
                  />

                  {finalIsApproved && hasActiveBid && chonkBid && (
                    <AcceptOfferButton
                      amountInWei={formatEther(chonkBid.amountInWei)}
                      bidder={chonkBid.bidder}
                      handleAcceptBidForChonk={handleAcceptBidForChonk}
                      isPending={isAcceptBidPending}
                    />
                  )}
                </>
              ) : (
                !isOwner && (
                  <MakeCancelOfferButton
                    hasOffer={Boolean(
                      hasActiveBid && chonkBid && chonkBid.bidder === address
                    )}
                    handleSubmit={() => setIsOfferModalOpen(true)}
                    handleWithdrawBid={handleWithdrawBidOnChonk}
                    isWithdrawBidPending={isWithdrawBidOnChonkPending}
                    isMakeOfferPending={isBidOnChonkPending}
                  />
                )
              )}
            </div>
          </>
        )}
      </div>

      <ModalWrapper
        isOpen={isModalOpen}
        onClose={handleModalClose}
        localListingPending={localListingPending}
      >
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
          }}
        />
      </ModalWrapper>

      <ModalWrapper
        isOpen={isOfferModalOpen}
        onClose={() => {
          setPriceError("");
          setOfferAmount("");
          setIsOfferModalOpen(false);
        }}
        localListingPending={localBidOnChonkPending}
      >
        <OfferModal
          chonkId={chonkId}
          offerAmount={offerAmount}
          setOfferAmount={setOfferAmount}
          minimumOffer={minimumOffer}
          priceError={priceError}
          hasActiveBid={hasActiveBid}
          currentBid={chonkBid}
          onSubmit={handleOfferSubmit}
          onClose={handleBidModalClose}
          ownedChonks={[]}
          isBidPending={localBidOnChonkPending}
          chonkSelectError={""}
        />
      </ModalWrapper>
    </>
  );
}
