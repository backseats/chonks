import { useState, useMemo, useEffect, useCallback } from "react";
import useGetTraitListing from "@/hooks/marketplace/traits/useGetTraitListing";
import useGetTraitBid from "@/hooks/marketplace/traits/useGetTraitBid";
import { useEthPrice } from "@/hooks/useEthPrice";
import {
  useBalance,
  useAccount,
  useEnsAddress,
  useEnsName,
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
import {
  traitsContract,
  traitsABI,
  chainId,
  marketplaceContract,
  marketplaceABI,
} from "@/config";
import { useUnequipTrait } from "@/hooks/marketplace/traits/useUnequipTrait";
import { truncateEthAddress } from "@/utils/truncateEthAddress";
import { ActionButton } from "../chonks/buttons/ActionButton";
import MarketplaceConnectKitButton from "../common/MarketplaceConnectKitButton";
import CurrentBid from "../common/CurrentBid";
import ListOrApproveButton from "../common/ListOrApproveButton";
import TransactionButton from "@/components/TransactionButton";

type PriceAndActionsSectionProps = {
  isOwner: boolean;
  chonkId: number;
  traitId: number;
  tbaOwner: string | null;
  isEquipped: boolean;
  tbaAddress: Address | null;
  refetchOwner: () => void;
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
    tbaOwner,
    isEquipped,
    tbaAddress,
    refetchOwner,
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

  const {
    price,
    hasActiveOffer,
    isOfferSpecific,
    canAcceptOffer,
    onlySellToAddress,
    refetchTraitListing,
  } = useGetTraitListing(address, traitId);

  const { traitBid, hasActiveBid, refetchTraitBid, bidOnTraitGoesToChonkId } =
    useGetTraitBid(traitId);

  const { handleUnequipTrait, isUnequipTraitPending, isUnequipTraitSuccess } =
    useUnequipTrait();

  const { finalIsApproved, approvalError, handleApproveTBAForMarketplace } =
    useTBAApproval(tbaAddress);

  const [isPrivateListingExpanded, setIsPrivateListingExpanded] =
    useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [localListingPending, setLocalListingPending] = useState(false);
  const [selectedChonkId, setSelectedChonkId] = useState<string>("");

  const [addressError, setAddressError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [chonkSelectError, setChonkSelectError] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCancelingOffer, setIsCancelingOffer] = useState(false);

  const [isLocalBidOnTraitPending, setIsLocalBidOnTraitPending] =
    useState(false);

  const { ownedChonks } = useOwnedChonks(address);

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

  useEffect(() => {
    if (hasActiveBid && traitBid && minimumOffer) {
      setOfferAmount(minimumOffer);
    } else {
      setOfferAmount("");
    }
    setPriceError("");
  }, [hasActiveBid, traitBid, minimumOffer]);

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

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setListingPrice("");
    setRecipientAddress("");
    setAddressError("");
    setPriceError("");
    setLocalListingPending(false);
    setIsPrivateListingExpanded(false);
    setError(null);
  }, []);

  const handleBidModalClose = useCallback(() => {
    setIsOfferModalOpen(false);
    setOfferAmount("");
    setChonkSelectError("");
    setPriceError("");
    setError(null);
    setIsLocalBidOnTraitPending(false);
    setSelectedChonkId("");
  }, []);

  const validateListing = useCallback(() => {
    let isValid = true;

    setPriceError("");
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
    isPrivateListingExpanded,
    resolvedAddress,
    recipientAddress,
  ]);

  const validateBid = useCallback(() => {
    let isValid = true;

    if (hasActiveBid && traitBid && minimumOffer) {
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
    } else {
      setPriceError(`Minimum Offer is ${MIN_LISTING_PRICE} ETH`);
      setOfferAmount(MIN_LISTING_PRICE);
      isValid = false;
    }

    if (selectedChonkId === "") {
      setChonkSelectError("Please select a Chonk to continue");
      isValid = false;
    }

    if (isValid) {
      setIsLocalBidOnTraitPending(true);
      setPriceError("");
      setChonkSelectError("");
    }

    return isValid;
  }, [offerAmount, minimumOffer, hasActiveBid, traitBid, selectedChonkId]);

  const renderOwnerActions = () => (
    <div className="flex flex-col gap-2">
      <TransactionButton
        buttonStyle="secondary"
        address={marketplaceContract}
        abi={marketplaceABI}
        args={[traitId, chonkId]}
        functionName="cancelOfferTrait"
        label="Cancel Listing"
        inFlightLabel="Canceling Listing..."
        onSuccess={() => {
          refetchTraitListing();
          setListingPrice("");
          setError(null);
        }}
        reset={() => setError(null)}
        setError={setError}
      />

      {hasActiveBid && traitBid && (
        <TransactionButton
          buttonStyle="primary"
          address={marketplaceContract}
          abi={marketplaceABI}
          args={[traitId, traitBid.bidder]}
          functionName="acceptBidForTrait"
          label={`Accept Offer of ${formatEther(traitBid.amountInWei)} ETH`}
          inFlightLabel="Accepting Offer..."
          onSuccess={() => {
            window.location.reload();
            setError(null);
          }}
          reset={() => setError(null)}
          setError={setError}
        />
      )}

      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </div>
  );

  const renderBuyerActions = () => (
    <div className="flex flex-col gap-2">
      {!isOfferSpecific && (
        <div className="mb-2 sm:mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buy Trait for which Chonk?
          </label>
          <select
            value={selectedChonkId}
            onChange={(e) => {
              setSelectedChonkId(e.target.value);
              setError(null);
            }}
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

      <TransactionButton
        buttonStyle="primary"
        address={marketplaceContract}
        abi={marketplaceABI}
        args={[traitId, parseInt(selectedChonkId || "0")]}
        functionName="buyTrait"
        priceInWei={price ? parseEther(price.toString()) : undefined}
        label={
          isOfferSpecific
            ? canAcceptOffer
              ? "Accept Private Offer"
              : "Private Offer - Not For You"
            : "Buy Now"
        }
        inFlightLabel="Purchasing Trait..."
        // disabled={Boolean(
        //   (isOfferSpecific && !canAcceptOffer) ||
        //     hasInsufficientBalance ||
        //     (!isOfferSpecific && !selectedChonkId) ||
        //     !price
        // )}
        reset={() => setError(null)}
        setError={setError}
        onSuccess={() => {
          window.location.reload(); // TODO: probably a better refetch here
          setError(null);
        }}
      />

      {hasInsufficientBalance && (
        <div className="text-red-500 text-sm mt-2">
          Your ETH balance is too low to buy this Trait.
        </div>
      )}

      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

      {hasActiveBid && traitBid && traitBid.bidder === address && (
        <>
          <div className="flex flex-col gap-3">
            <ActionButton
              variant="primary"
              onClick={() => {
                setPriceError("");
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
              args={[traitId]}
              functionName="withdrawBidOnTrait"
              label="Cancel my Offer"
              inFlightLabel="Canceling Offer..."
              setError={setError}
              reset={() => setError(null)}
              onSuccess={() => {
                refetchTraitBid();
                setError(null);
                setListingPrice("");
                setRecipientAddress("");
              }}
              setIsCancelingOffer={setIsCancelingOffer}
            />

            {error && <div className="text-red-500 text-sm">{error}</div>}
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="border m-4 sm:m-0 border-black p-3 sm:p-[1.725vw] mb-[1.725vw]">
        {/* Has Offer, or just been Listed */}
        {hasActiveOffer ? (
          <>
            <div className="flex flex-col mb-4">
              <div className="flex items-baseline gap-2">
                <div className="text-[20px]">
                  {tbaOwner === address ? `Listed for` : `Buy for`}
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

              {hasActiveBid && traitBid && (
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
                chonkId={Number(bidOnTraitGoesToChonkId?.toString())}
              />
            )}

            <div className="flex flex-col gap-2">
              {!address ? (
                <MarketplaceConnectKitButton />
              ) : isOwner || tbaOwner === address ? (
                <>
                  <ListOrApproveButton
                    traitId={traitId}
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
                      <TransactionButton
                        buttonStyle="primary"
                        address={marketplaceContract}
                        abi={marketplaceABI}
                        args={[traitId, traitBid.bidder]}
                        functionName="acceptBidForTrait"
                        label={`Accept Offer of ${formatEther(
                          traitBid.amountInWei
                        )} ETH`}
                        inFlightLabel="Accepting Offer..."
                        setError={setError}
                        reset={() => setError(null)}
                        onSuccess={() => {
                          refetchTraitBid();
                          refetchOwner();
                          setError(null);
                        }}
                      />
                    )}
                </>
              ) : (
                !isOwner &&
                tbaOwner !== address && (
                  <>
                    {ownedChonks && ownedChonks.length > 0 ? (
                      Boolean(
                        hasActiveBid && traitBid && traitBid.bidder === address
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
                            args={[traitId]}
                            functionName={"withdrawBidOnTrait"}
                            label={"Cancel my Offer"}
                            inFlightLabel={"Canceling Offer..."}
                            setError={setError}
                            reset={() => {
                              setError(null);
                            }}
                            onSuccess={() => {
                              refetchTraitBid();
                              setError(null);
                              setRecipientAddress("");
                              setOfferAmount("");
                            }}
                            setIsCancelingOffer={setIsCancelingOffer}
                          />
                          {error && (
                            <div className="text-red-500 text-sm">{error}</div>
                          )}
                        </div>
                      ) : (
                        <ActionButton
                          variant="primary"
                          onClick={() => {
                            setListingPrice("");
                            setIsOfferModalOpen(true);
                          }}
                        >
                          Make an Offer
                        </ActionButton>
                      )
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
                  </>
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
          traitId={traitId}
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
              ? [traitId, chonkId, parseEther(listingPrice), resolvedAddress]
              : [traitId, chonkId, parseEther(listingPrice)]
          }
          functionName={isValidAddress ? "offerTraitToAddress" : "offerTrait"}
          inFlightLabel="Listing your Trait..."
          onSuccess={() => {
            handleModalClose();
            refetchTraitListing();
          }}
          validateListing={validateListing}
        />
      </ModalWrapper>

      <ModalWrapper
        isOpen={isOfferModalOpen}
        onClose={() => {
          setIsOfferModalOpen(false);
          setChonkSelectError("");
          setPriceError("");
          setOfferAmount("");
          setSelectedChonkId("");
        }}
        localListingPending={isLocalBidOnTraitPending}
      >
        <OfferModal
          chonkId={chonkId}
          traitId={traitId}
          offerAmount={offerAmount}
          setOfferAmount={setOfferAmount}
          minimumOffer={minimumOffer}
          hasActiveBid={hasActiveBid}
          currentBid={traitBid}
          onClose={handleBidModalClose}
          ownedChonks={ownedChonks}
          selectedChonkId={selectedChonkId}
          setSelectedChonkId={setSelectedChonkId}
          priceError={priceError}
          chonkSelectError={chonkSelectError}
          onSuccess={() => {
            refetchTraitBid();
            setOfferAmount("");
            setSelectedChonkId("");
            handleBidModalClose();
          }}
          value={parseEther(offerAmount)}
          validateBid={validateBid}
          address={marketplaceContract}
          abi={marketplaceABI}
          args={[traitId, parseInt(selectedChonkId)]}
          functionName="bidOnTrait"
          inFlightLabel="Creating Bid..."
          setError={setError}
        />
      </ModalWrapper>
    </>
  );
}
