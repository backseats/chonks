import { useState, useMemo, useEffect, useCallback } from "react";
import { useBalance, useAccount, useEnsAddress, useEnsName } from "wagmi";
import { parseEther, isAddress, formatEther, getAddress, Address } from "viem";
import { mainnet } from "wagmi/chains";
import { ModalWrapper } from "./modals/ModalWrapper";
import { ListingModal } from "./modals/ListingModal";
import { OfferModal } from "./modals/OfferModal";
import { ActionButton } from "./buttons/ActionButton";
import MarketplaceConnectKitButton from "../common/MarketplaceConnectKitButton";
import CurrentBid from "../common/CurrentBid";
import ListOrApproveButton from "../common/ListOrApproveButton";
import { truncateEthAddress } from "@/utils/truncateEthAddress";
import useApproval from "@/hooks/marketplace/chonks/useApproval";
import useGetChonkBid from "@/hooks/marketplace/chonks/useGetChonkBid";
import useGetChonkListing from "@/hooks/marketplace/chonks/useGetChonkListing";
import { useEthPrice } from "@/hooks/useEthPrice";
import TransactionButton from "@/components/TransactionButton";
import { marketplaceContract, marketplaceABI } from "@/config";
import ErrorDisplay from "@/components/marketplace/common/ErrorDisplay";

export default function PriceAndActionsSection({
  chonkId,
  isOwner,
  refetchOwner,
}: {
  chonkId: number;
  isOwner: boolean;
  refetchOwner: () => void;
}) {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listingPrice, setListingPrice] = useState("");
  const { ethPrice } = useEthPrice();

  //// Hooks ////

  const {
    canAcceptOffer,
    hasActiveOffer,
    isOfferSpecific,
    onlySellToAddress,
    price,
    refetchChonkOffer: refetchChonkListing,
  } = useGetChonkListing(address, chonkId);

  const {
    finalIsApproved,
    handleApproveMarketplace,
    isApprovalPending,
    approvalError,
  } = useApproval(address);

  const { chonkBid, hasActiveBid, refetchChonkBid } = useGetChonkBid(chonkId);

  ////////////////////////////////////////////////////////////

  const [isPrivateListingExpanded, setIsPrivateListingExpanded] =
    useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");

  const [localListingPending, setLocalListingPending] = useState(false);
  const [localBidOnChonkPending, setLocalBidOnChonkPending] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isCancelingOffer, setIsCancelingOffer] = useState(false);

  const OFFER_PRICE_DECIMAL_PRECISION = 4;
  const MIN_LISTING_PRICE = `0.${"0".repeat(
    OFFER_PRICE_DECIMAL_PRECISION - 1
  )}1`;
  const STEP_SIZE = MIN_LISTING_PRICE;

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

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setListingPrice("");
    setRecipientAddress("");
    setPriceError("");
    setAddressError("");
    setLocalListingPending(false);
    setIsPrivateListingExpanded(false);
  }, []);

  const handleBidModalClose = useCallback(() => {
    setPriceError("");
    setOfferAmount("");
    setIsOfferModalOpen(false);
    setLocalBidOnChonkPending(false);
  }, []);

  const validateListing = useCallback(() => {
    let isValid = true;

    setPriceError(""); // Reset errors
    setAddressError("");

    const listingPriceNum = Number(listingPrice);
    if (listingPriceNum < Number(MIN_LISTING_PRICE)) {
      setPriceError(`Minimum listing price is ${MIN_LISTING_PRICE} ETH`);
      isValid = false;
    }

    if (recipientAddress === "") {
      setAddressError("");
      setIsPrivateListingExpanded(false);
    }

    if (isPrivateListingExpanded) {
      if (recipientAddress !== "" && resolvedAddress === "") {
        setAddressError("Please enter a valid address or ENS name");
        isValid = false;
      } else if (resolvedAddress) {
        setRecipientAddress(resolvedAddress);
      }
    }

    if (isValid) setLocalListingPending(true);

    return isValid;
  }, [
    listingPrice,
    resolvedAddress,
    isPrivateListingExpanded,
    recipientAddress,
  ]);

  const validateBid = useCallback(() => {
    let isValid = true;

    if (hasActiveBid && chonkBid && minimumOffer) {
      if (Number(offerAmount) < Number(minimumOffer)) {
        setPriceError(
          `Offer must be at least 5% higher than the current Bid. Minimum Offer: ${minimumOffer} ETH`
        );
        setOfferAmount(minimumOffer);
        isValid = false;
      }
    }

    if (offerAmount) {
      const offerAmountNum = Number(offerAmount);
      if (offerAmountNum < Number(MIN_LISTING_PRICE)) {
        setPriceError(`Minimum Offer is ${MIN_LISTING_PRICE} ETH`);
        setOfferAmount(MIN_LISTING_PRICE);
        isValid = false;
      }
    }

    if (isValid) {
      setLocalBidOnChonkPending(true);
      setPriceError("");
    }

    return isValid;
  }, [offerAmount, minimumOffer, hasActiveBid, chonkBid]);

  return (
    <>
      <div className="border m-4 sm:m-0 border-black p-3 sm:p-[1.725vw] mb-[1.725vw]">
        {/* Has Offer, or just been Listed */}
        {hasActiveOffer ? (
          <>
            <div className="flex flex-col mb-4">
              <div className="flex items-baseline gap-2">
                <div className="text-[20px]">
                  {isOwner ? `Listed for` : `Buy for`}
                </div>

                <span className="text-[20px] sm:text-2xl font-bold">
                  {price} ETH
                </span>
                {ethPrice && price && (
                  <span className="text-gray-500 text-sm">
                    ($
                    {(price * ethPrice).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    )
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
                    : ensOnlySellToAddress ||
                      truncateEthAddress(onlySellToAddress)}
                </span>
              )}

              {hasActiveBid && chonkBid && (
                <div className="text-[18px] mt-1">
                  {chonkBid.bidder === address
                    ? `Your Offer: `
                    : "Highest Bid:"}{" "}
                  {formatEther(chonkBid.amountInWei)} ETH
                </div>
              )}
            </div>

            {!address ? (
              <MarketplaceConnectKitButton />
            ) : isOwner ? (
              <div className="flex flex-col gap-2">
                <TransactionButton
                  buttonStyle="secondary"
                  address={marketplaceContract}
                  abi={marketplaceABI}
                  args={[Number(chonkId)]}
                  functionName={"cancelOfferChonk"}
                  label={"Cancel Listing"}
                  inFlightLabel={"Canceling Listing..."}
                  onSuccess={() => {
                    refetchChonkListing();
                    setListingPrice("");
                    setError(null);
                  }}
                  reset={() => setError(null)}
                  setError={setError}
                />

                <ErrorDisplay error={error} />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <TransactionButton
                  buttonStyle="primary"
                  address={marketplaceContract}
                  abi={marketplaceABI}
                  args={[Number(chonkId)]}
                  functionName={"buyChonk"}
                  priceInWei={price ? parseEther(price.toString()) : undefined}
                  label={
                    isOfferSpecific
                      ? canAcceptOffer
                        ? "Buy Now"
                        : "This Offer is Private"
                      : "Buy Now"
                  }
                  inFlightLabel={"Purchasing your Chonk..."}
                  setError={setError}
                  reset={() => {
                    setError(null);
                  }}
                  onSuccess={() => {
                    handleModalClose();
                    refetchOwner();
                    refetchChonkListing();
                  }}
                />

                {/* <ActionButton
                  variant="primary"
                  onClick={() => {
                    setOfferAmount("");
                    setIsOfferModalOpen(true);
                  }}
                >
                  Make an Offer
                </ActionButton>
                */}

                <ErrorDisplay error={error} />
              </div>
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

            <div className="flex flex-col gap-0">
              {!address ? (
                <MarketplaceConnectKitButton />
              ) : isOwner ? (
                <>
                  <ListOrApproveButton
                    isApprovalPending={isApprovalPending}
                    finalIsApproved={finalIsApproved}
                    handleApproveMarketplace={handleApproveMarketplace}
                    setIsModalOpen={setIsModalOpen}
                    approvalError={approvalError ?? null}
                    hasActiveBid={hasActiveBid}
                  />

                  {finalIsApproved && hasActiveBid && chonkBid && (
                    <div className="mt-3">
                      <TransactionButton
                        buttonStyle="primary"
                        address={marketplaceContract}
                        abi={marketplaceABI}
                        args={[Number(chonkId), chonkBid.bidder]}
                        functionName={"acceptBidForChonk"}
                        label={`Accept Offer of ${formatEther(
                          chonkBid.amountInWei
                        )} ETH`}
                        inFlightLabel={"Accepting Offer..."}
                        setError={setError}
                        reset={() => {
                          setError(null);
                        }}
                        onSuccess={() => {
                          refetchChonkBid();
                          refetchOwner();
                          setError(null);
                        }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {Boolean(
                    hasActiveBid && chonkBid && chonkBid.bidder === address
                  ) ? (
                    <div className="flex flex-col gap-3">
                      <ActionButton
                        variant="primary"
                        onClick={() => {
                          setPriceError("");
                          setError(null);
                          setIsOfferModalOpen(true);
                        }}
                        disabled={isCancelingOffer}
                      >
                        Increase my Offer
                      </ActionButton>

                      <TransactionButton
                        buttonStyle="secondary"
                        address={marketplaceContract}
                        abi={marketplaceABI}
                        args={[Number(chonkId)]}
                        functionName={"withdrawBidOnChonk"}
                        label={"Cancel my Offer"}
                        inFlightLabel={"Canceling Offer..."}
                        setError={setError}
                        reset={() => {
                          setError(null);
                        }}
                        onSuccess={() => {
                          refetchChonkBid();
                          setError(null);
                          setRecipientAddress("");
                          setOfferAmount("");
                        }}
                        setIsCancelingOffer={setIsCancelingOffer}
                      />
                      <ErrorDisplay error={error} />
                    </div>
                  ) : (
                    <ActionButton
                      variant="primary"
                      onClick={() => {
                        setOfferAmount("");
                        setIsOfferModalOpen(true);
                      }}
                    >
                      Make an Offer
                    </ActionButton>
                  )}
                </>
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
          onClose={handleModalClose}
          address={marketplaceContract}
          abi={marketplaceABI}
          args={
            isValidAddress
              ? [Number(chonkId), parseEther(listingPrice), recipientAddress]
              : [Number(chonkId), parseEther(listingPrice)]
          }
          functionName={isValidAddress ? "offerChonkToAddress" : "offerChonk"}
          inFlightLabel={"Listing your Chonk..."}
          onSuccess={() => {
            handleModalClose();
            refetchChonkListing();
          }}
          validateListing={validateListing}
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
          onClose={handleBidModalClose}
          ownedChonks={[]}
          chonkSelectError={""}
          address={marketplaceContract}
          abi={marketplaceABI}
          args={[Number(chonkId)]}
          functionName={"bidOnChonk"}
          inFlightLabel={"Creating Bid..."}
          onSuccess={() => {
            refetchChonkBid();
            setOfferAmount("");
            handleBidModalClose();
            setIsCancelingOffer(false);
          }}
          value={parseEther(offerAmount)}
          validateBid={validateBid}
          setError={setError}
        />
      </ModalWrapper>
    </>
  );
}
