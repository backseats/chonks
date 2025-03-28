import { useState, useMemo, useEffect } from "react";
import useListTrait from "@/hooks/marketplace/traits/useListTrait";
import useBuyTrait from "@/hooks/marketplace/traits/useBuyTrait";
import useCancelOfferTrait from "@/hooks/marketplace/traits/useCancelOfferTrait";
import useBidOnTrait from "@/hooks/marketplace/traits/useBidOnTrait";
import useWithdrawBidOnTrait from "@/hooks/marketplace/traits/useWithdrawBidOnTrait";
import useAcceptBidForTrait from "@/hooks/marketplace/traits/useAcceptBidForTrait";
import useGetTraitBid from "@/hooks/marketplace/traits/useGetTraitBid";
import { useEthPrice } from "@/hooks/useEthPrice";

import {
  useBalance,
  useAccount,
  useEnsAddress,
  useEnsName,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { parseEther, isAddress, formatEther, getAddress, Address } from "viem";
import { mainnet } from "wagmi/chains"; // mainnet for ens lookup
import { useOwnedChonks } from "@/hooks/useOwnedChonks";
import Link from "next/link";
import { useTBAApproval } from "@/hooks/marketplace/traits/useTBAApproval";
import { OfferModal } from "@/components/marketplace/chonks/modals/OfferModal";
import { ModalWrapper } from "@/components/marketplace/chonks/modals/ModalWrapper";
import { ListingModal } from "@/components/marketplace/chonks/modals/ListingModal";
import { traitsContract, traitsABI, chainId } from "@/config";
import { useUnequipTrait } from "@/hooks/marketplace/traits/useUnequipTrait";
import { truncateEthAddress } from "@/utils/truncateEthAddress";
// Import common components
import { ActionButton } from "../chonks/buttons/ActionButton";
import MarketplaceConnectKitButton from "../common/MarketplaceConnectKitButton";
import CurrentBid from "../common/CurrentBid";
import AcceptOfferButton from "../common/AcceptOfferButton";
import MakeCancelOfferButton from "../common/MakeCancelOfferButton";
import ListOrApproveButton from "../common/ListOrApproveButton";

type PriceAndActionsSectionProps = {
  isOwner: boolean;
  chonkId: number;
  traitId: number;
  tokenIdOfTBA: string | null;
  tbaOwner: string | null;
  isEquipped: boolean;
  tbaAddress: Address | null;
  traitName?: string;
};

type StoredTrait = {
  traitType: number;
  epoch: number;
  isRevealed: boolean;
  seed: number;
  dataMinterContract: string;
  traitIndex: number;
  traitName: string | undefined;
};

export default function PriceAndActionsSection(
  props: PriceAndActionsSectionProps
) {
  const {
    isOwner,
    chonkId,
    traitId,
    tokenIdOfTBA,
    tbaOwner,
    isEquipped,
    tbaAddress,
    traitName,
  } = props;

  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listingPrice, setListingPrice] = useState("");
  const { ethPrice } = useEthPrice();

  const OFFER_PRICE_DECIMAL_PRECISION = 4;
  const MIN_LISTING_PRICE = `0.${"0".repeat(
    OFFER_PRICE_DECIMAL_PRECISION - 1
  )}1`;
  const STEP_SIZE = MIN_LISTING_PRICE;

  // Replace monolithic hook with individual hooks
  const {
    handleListTrait,
    isListTraitPending,
    isListTraitSuccess,
    isListingRejected,
    listTraitError,
    price,
    hasActiveOffer,
    isOfferSpecific,
    canAcceptOffer,
    onlySellToAddress,
  } = useListTrait(address, traitId);

  const {
    handleBuyTrait,
    isBuyTraitPending,
    isBuyTraitSuccess,
    isBuyTraitError,
    buyTraitError,
  } = useBuyTrait(traitId);

  const {
    handleCancelOfferTrait,
    isCancelOfferTraitPending,
    isCancelOfferTraitSuccess,
    isCancelOfferTraitRejected,
    cancelOfferTraitError,
  } = useCancelOfferTrait(address, traitId);

  const {
    handleBidOnTrait,
    isBidOnTraitPending,
    isBidOnTraitSuccess,
    isBidOnTraitError,
    bidOnTraitError,
  } = useBidOnTrait(traitId);

  const {
    handleWithdrawBidOnTrait,
    isWithdrawBidOnTraitPending,
    isWithdrawBidOnTraitSuccess,
    isWithdrawBidOnTraitError,
    withdrawBidOnTraitError,
  } = useWithdrawBidOnTrait(traitId);

  const {
    handleAcceptBidForTrait,
    isAcceptBidPending,
    isAcceptBidSuccess,
    isAcceptBidError,
    acceptBidError,
  } = useAcceptBidForTrait(traitId);

  const { traitBid, hasActiveBid, refetchTraitBid, getTraitBidError } =
    useGetTraitBid(traitId);

  const {
    handleUnequipTrait,
    isUnequipTraitPending,
    isUnequipTraitSuccess,
    isUnequipTraitError,
    unequipTraitError,
  } = useUnequipTrait();

  const { finalIsApproved, approvalError, handleApproveTBAForMarketplace } =
    useTBAApproval(tbaAddress);

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
  const [selectedChonkId, setSelectedChonkId] = useState<string>("");
  const [localCancelOfferTraitPending, setLocalCancelOfferTraitPending] =
    useState(false);
  const [localCancelOfferTraitSuccess, setLocalCancelOfferTraitSuccess] =
    useState(false);

  const [chonkSelectError, setChonkSelectError] = useState("");

  const { ownedChonks } = useOwnedChonks(address); // This hook should fetch owned Chonks

  // Calculate minimum offer (5% higher than current bid)
  const minimumOffer = useMemo(() => {
    if (hasActiveBid && traitBid) {
      const currentBidEth = Number(formatEther(traitBid.amountInWei));
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
  }, [hasActiveBid, traitBid]);

  // let's initially set offerAmount to the minimum offer
  useEffect(() => {
    if (hasActiveBid && traitBid && minimumOffer) {
      setOfferAmount(minimumOffer);
    }
  }, [hasActiveBid, traitBid, minimumOffer]);

  useEffect(() => {
    if (isWithdrawBidOnTraitSuccess) {
      refetchTraitBid();
      setOfferAmount("");
    }
  }, [isWithdrawBidOnTraitSuccess]);

  // Add ENS resolution
  const { data: ensAddress } = useEnsAddress({
    name: recipientAddress.endsWith(".eth")
      ? recipientAddress.toLowerCase()
      : undefined,
    chainId: mainnet.id,
  });

   // onlySellToAddress ens name
   const { data: ensOnlySellToAddress } = useEnsName({
    address: onlySellToAddress as Address,
    chainId: mainnet.id,
  });

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

  useEffect(() => {
    if (isListingRejected) {
      setLocalListingRejected(true);
    }
  }, [isListingRejected]);

  useEffect(() => {
    if (isListTraitPending) {
      setLocalListingPending(true);
    }
  }, [isListTraitPending]);

  useEffect(() => {
    if (isListTraitSuccess) {
      setLocalListingSuccess(true);
    }
  }, [isListTraitSuccess]);

  // Track cancel offer state
  useEffect(() => {
    if (isCancelOfferTraitRejected) {
      setLocalCancelOfferTraitPending(false);
      setLocalCancelOfferTraitSuccess(false);
      return;
    }

    if (isCancelOfferTraitPending) {
      setLocalCancelOfferTraitPending(true);
      return;
    }

    if (isCancelOfferTraitSuccess) {
      setLocalCancelOfferTraitPending(false);
      setLocalCancelOfferTraitSuccess(true);
      return;
    }
  }, [
    isCancelOfferTraitPending,
    isCancelOfferTraitSuccess,
    isCancelOfferTraitRejected,
  ]);

  // Reload after a buy
  useEffect(() => {
    if (isBuyTraitSuccess) window.location.reload();
  }, [isBuyTraitSuccess]);

  // Reload after an accept/buy
  useEffect(() => {
    if (isAcceptBidSuccess) window.location.reload();
  }, [isAcceptBidSuccess]);

  // Reload after an unequip
  useEffect(() => {
    if (isUnequipTraitSuccess) window.location.reload();
  }, [isUnequipTraitSuccess]);

  const { data: storedTrait } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "getTrait",
    args: [traitId],
    chainId,
  }) as { data: StoredTrait | undefined };

  const traitTypeId = storedTrait?.traitType;

  function handleOfferSubmit() {
    if (hasActiveBid && traitBid && minimumOffer) {
      if (Number(offerAmount) < Number(minimumOffer)) {
        alert(
          `Your offer must be at least 5% higher than the current bid. Minimum offer: ${minimumOffer} ETH`
        );
        return;
      }
    }

    if (selectedChonkId === "") {
      setChonkSelectError("Please select a Chonk to continue");
      return;
    } else {
      setChonkSelectError("");
    }

    if (offerAmount) {
      handleBidOnTrait(parseInt(selectedChonkId), offerAmount);
      return;
    } else {
      setPriceError("Enter an amount, minimum of " + minimumOffer + " ETH");
      return;
    }
  }

  useEffect(() => {
    if (isBidOnTraitSuccess) {
      setIsOfferModalOpen(false);
      setOfferAmount("");
      setIsPrivateListingExpanded(false);
      setAddressError("");
      setChonkSelectError("");
      setPriceError("");

      refetchTraitBid();
    }
  }, [isBidOnTraitSuccess]);

  function handleModalClose() {
    resetForm();
  }

  function handleListingSubmit() {
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
      handleListTrait(
        listingPrice,
        parseInt(tokenIdOfTBA ?? "0"),
        resolvedAddress
      );
    } else {
      handleListTrait(listingPrice, parseInt(tokenIdOfTBA ?? "0"));
    }

    resetForm();
  }

  function resetForm() {
    setIsModalOpen(false);
    setListingPrice("");
    setOfferAmount("");
    setRecipientAddress("");
    setAddressError("");
    setPriceError("");
    setIsPrivateListingExpanded(false);
  }

  // Render owner actions
  const renderOwnerActions = () => (
    <div className="flex flex-col gap-2">
      <ActionButton
        variant="danger"
        onClick={() => handleCancelOfferTrait(parseInt(tokenIdOfTBA ?? "0"))}
        disabled={localCancelOfferTraitPending && !isCancelOfferTraitSuccess}
      >
        {localCancelOfferTraitPending && !isCancelOfferTraitSuccess
          ? "Confirm with your wallet"
          : "Cancel Listing"}
      </ActionButton>

      {hasActiveBid && traitBid && (
        <AcceptOfferButton
          amountInWei={formatEther(traitBid.amountInWei)}
          bidder={traitBid.bidder}
          handleAcceptBidForChonk={handleAcceptBidForTrait}
          isPending={isAcceptBidPending}
        />
      )}

      {acceptBidError && (
        <p className="text-red-500 text-sm mt-2">{acceptBidError}</p>
      )}
    </div>
  );

  // Render buyer actions
  const renderBuyerActions = () => (
    <div className="flex flex-col gap-2">
      {/* Chonk selection for buying traits */}
      {!isOfferSpecific && (
        <div className="mb-2 sm:mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Which Chonk will own this Trait?
          </label>
          <select
            value={selectedChonkId}
            onChange={(e) => setSelectedChonkId(e.target.value)}
            className="w-full text-[14px] sm:text-sm font-medium p-2 border bg-white"
          >
            <option value="">Select a Chonk</option>
            {ownedChonks?.map((chonk) => (
              <option key={parseInt(chonk)} value={parseInt(chonk)}>
                Chonk #{parseInt(chonk)}
              </option>
            ))}
          </select>
        </div>
      )}

      <ActionButton
        variant="primary"
        disabled={Boolean(
          (isOfferSpecific && !canAcceptOffer) ||
            hasInsufficientBalance ||
            (!isOfferSpecific && !selectedChonkId) ||
            isBuyTraitPending
        )}
        onClick={() => {
          if (price) {
            handleBuyTrait(price, parseInt(selectedChonkId));
          }
        }}
      >
        {isOfferSpecific
          ? canAcceptOffer
            ? "Accept Private Offer"
            : "Private Offer - Not For You"
          : isBuyTraitPending
          ? "Confirm with your wallet"
          : "Buy Now"}
      </ActionButton>

      {hasInsufficientBalance && (
        <p className="text-red-500 text-sm mt-2">
          Your ETH balance is too low to buy this Trait.
        </p>
      )}

      {buyTraitError && (
        <p className="text-red-500 text-sm mt-2">{buyTraitError}</p>
      )}

      {hasActiveBid && traitBid && traitBid.bidder === address && (
        <>
          <ActionButton
            variant="danger"
            onClick={handleWithdrawBidOnTrait}
            disabled={isWithdrawBidOnTraitPending}
          >
            Cancel Your Offer
          </ActionButton>

          {withdrawBidOnTraitError && !isWithdrawBidOnTraitPending && (
            <div className="text-red-500 text-sm mt-2">
              {withdrawBidOnTraitError}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="border m-4 sm:m-0 border-black p-3 sm:p-[1.725vw] mb-[1.725vw]">
        {/* Has Offer, or just been Listed */}
        {(hasActiveOffer || isListTraitSuccess) &&
        !localCancelOfferTraitSuccess ? (
          <>
            <div className="flex flex-col mb-4">
              <div className="flex items-baseline gap-2">
                <div className="text-[20px] sm:text-xl">
                  {isOwner ? `Listed for` : `Buy for`}
                </div>

                <span className="text-[20px] sm:text-2xl font-bold">
                  {price} ETH
                </span>
                {ethPrice && price && (
                  <span className="text-gray-500 text-sm">
                    (${(price * ethPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })})
                  </span>
                )}
              </div>

              {isOfferSpecific && (
                <span className="text-sm text-gray-500 mb-4 mt-1">
                  Private Listing for{" "}
                  {onlySellToAddress &&
                  address &&
                  getAddress(onlySellToAddress) === getAddress(address)
                    ? "You"
                    : ensOnlySellToAddress || truncateEthAddress(onlySellToAddress)}
                </span>
              )}

              {hasActiveBid && traitBid && !isWithdrawBidOnTraitSuccess && (
                <div className="text-xl">
                  Your Offer: {formatEther(traitBid.amountInWei)} ETH
                </div>
              )}
            </div>

            {!address ? (
              <MarketplaceConnectKitButton />
            ) : isOwner || tbaOwner === address ? (
              renderOwnerActions()
            ) : (
              <>{renderBuyerActions()}</>
            )}
          </>
        ) : (
          <>
            {hasActiveBid && traitBid && (
              <CurrentBid
                amountInWei={traitBid.amountInWei}
                bidder={traitBid.bidder}
                address={address}
              />
            )}

            <div className="flex flex-col gap-2">
              {!address ? (
                <MarketplaceConnectKitButton />
              ) : isOwner || tbaOwner === address ? (
                <>
                  <ListOrApproveButton
                    traitId={traitId}
                    traitName={traitName}
                    isApprovalPending={isUnequipTraitPending}
                    finalIsApproved={Boolean(finalIsApproved)}
                    handleApproveMarketplace={handleApproveTBAForMarketplace}
                    setIsModalOpen={setIsModalOpen}
                    approvalError={approvalError ?? null}
                    hasActiveBid={hasActiveBid}
                    isEquipped={isEquipped}
                    handleUnequipTrait={() =>
                      handleUnequipTrait(chonkId, traitTypeId)
                    }
                  />

                  {!isEquipped &&
                    finalIsApproved &&
                    hasActiveBid &&
                    traitBid && (
                      <AcceptOfferButton
                        amountInWei={formatEther(traitBid.amountInWei)}
                        bidder={traitBid.bidder}
                        handleAcceptBidForChonk={handleAcceptBidForTrait}
                        isPending={isAcceptBidPending}
                      />
                    )}

                  {acceptBidError && (
                    <div className="text-red-500 text-sm mt-2 text-center">
                      {acceptBidError}
                    </div>
                  )}
                </>
              ) : (
                !isOwner &&
                tbaOwner !== address && (
                  <>
                    {ownedChonks && ownedChonks.length > 0 ? (
                      <MakeCancelOfferButton
                        hasOffer={Boolean(
                          hasActiveBid &&
                            traitBid &&
                            traitBid.bidder === address
                        )}
                        handleSubmit={() => setIsOfferModalOpen(true)}
                        isWithdrawBidPending={isWithdrawBidOnTraitPending}
                        handleWithdrawBid={handleWithdrawBidOnTrait}
                        isMakeOfferPending={isBidOnTraitPending}
                      />
                    ) : (
                      <p className="text-red-500 text-[1.25vw]">
                        You need to own a Chonk to make an offer on this trait
                        <br />
                        <Link
                          className="text-chonk-blue underline"
                          href="/market/chonks"
                          rel="noopener noreferrer"
                        >
                          Go buy one here
                        </Link>
                      </p>
                    )}

                    {withdrawBidOnTraitError && (
                      <div className="text-red-500 text-sm mt-1 text-center">
                        {withdrawBidOnTraitError}
                      </div>
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
          traitId={traitId}
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
          setIsOfferModalOpen(false);
          setChonkSelectError("");
          setPriceError("");
          setOfferAmount("");
        }}
        localListingPending={isBidOnTraitPending}
      >
        <OfferModal
          chonkId={chonkId}
          traitId={traitId}
          offerAmount={offerAmount}
          setOfferAmount={setOfferAmount}
          minimumOffer={minimumOffer}
          hasActiveBid={hasActiveBid}
          currentBid={traitBid}
          onSubmit={handleOfferSubmit}
          onClose={() => setIsOfferModalOpen(false)}
          ownedChonks={ownedChonks}
          selectedChonkId={selectedChonkId}
          setSelectedChonkId={setSelectedChonkId}
          priceError={priceError}
          isBidPending={isBidOnTraitPending}
          chonkSelectError={chonkSelectError}
        />
      </ModalWrapper>
    </>
  );
}
