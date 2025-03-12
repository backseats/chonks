import { useState, useMemo, useEffect } from "react";
import { useMarketplaceActions } from "@/hooks/marketplace/traits/marketplaceAndMintHooks";
import {
  useBalance,
  useAccount,
  useEnsAddress,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { parseEther, isAddress, formatEther, getAddress } from "viem";
import { mainnet } from "wagmi/chains"; // mainnet for ens lookup
import { useOwnedChonks } from "@/hooks/useOwnedChonks";
import Link from "next/link";
import { useTBAApprovalWrite } from "@/hooks/useTBAApprovalWrite";
import {
  useReadEOAApproval,
  useReadTBAApproval,
} from "@/hooks/useApprovalRead";
import { OfferModal } from "@/components/marketplace/chonks/modals/OfferModal";
import { ModalWrapper } from "@/components/marketplace/chonks/modals/ModalWrapper";
import { ListingModal } from "@/components/marketplace/chonks/modals/ListingModal";
import { traitsContract, traitsABI, chainId } from "@/config";
import { useUnequipTrait } from "@/hooks/useUnequipTrait";
import { truncateEthAddress } from "@/utils/truncateEthAddress";
import { ConnectKitButton } from "connectkit";

type PriceAndActionsSectionProps = {
  isOwner: boolean;
  chonkId: number;
  traitId: number;
  tokenIdOfTBA: string | null;
  // price: number | null;
  // priceUSD: number;
  // isOfferSpecific: boolean;
  // canAcceptOffer: boolean;
  //
  // hasActiveOffer: boolean;
  // hasActiveBid: boolean;
  // traitBid?: {
  //   bidder: string;
  //   amountInWei: bigint;
  //   traitIds: bigint[];
  //   encodedTraitIds: string;
  // } | null;
  tbaOwner: string | null;
  isEquipped: boolean;
  tbaAddress: string | null;
};

type StoredTrait = {
  traitType: number;
  epoch: number;
  isRevealed: boolean;
  seed: number;
  dataMinterContract: string;
  traitIndex: number;
};

export default function PriceAndActionsSection(
  props: PriceAndActionsSectionProps
) {
  const {
    isOwner,
    chonkId,
    traitId,
    tokenIdOfTBA,
    // price,
    // priceUSD,
    // isOfferSpecific,
    // canAcceptOffer,

    // hasActiveOffer,
    // hasActiveBid,
    // traitBid,

    tbaOwner,
    isEquipped,
    tbaAddress,
  } = props;

  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listingPrice, setListingPrice] = useState("");

  const OFFER_PRICE_DECIMAL_PRECISION = 4;
  const MIN_LISTING_PRICE = `0.${"0".repeat(
    OFFER_PRICE_DECIMAL_PRECISION - 1
  )}1`;
  const STEP_SIZE = MIN_LISTING_PRICE;

  const {
    hasActiveBid,
    traitBid,
    price,
    hasActiveOffer,
    isOfferSpecific,
    canAcceptOffer,
    handleListTrait,
    handleListTraitToAddress,
    handleBuyTrait,
    handleCancelOfferTrait,
    handleBidOnTrait,
    handleWithdrawBidOnTrait,
    handleAcceptBidForTrait,
    hashListTrait,
    isListTraitLoading,
    isListingRejected,
    isListTraitPending,
    isListTraitSuccess,
    isListTraitError,
  } = useMarketplaceActions(traitId);

  const { TBAIsApproved } = useReadTBAApproval(tbaAddress as `0x${string}`);

  const { approveTBAForMarketplace } = useTBAApprovalWrite(
    tbaAddress as `0x${string}`
  );

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
  const [localHashListTrait, setLocalHashListTrait] = useState(false);
  const [selectedChonkId, setSelectedChonkId] = useState<string>("");

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

  // console.log("ownedChonks", ownedChonks, address);
  // console.log(ownedChonks?.map((chonk) => parseInt(chonk)));

  // Add ENS resolution
  const { data: ensAddress } = useEnsAddress({
    name: recipientAddress.endsWith(".eth")
      ? recipientAddress.toLowerCase()
      : undefined,
    chainId: mainnet.id,
  });

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

  useEffect(() => {
    if (hashListTrait) {
      setLocalHashListTrait(true);
    }
  }, [hashListTrait]);

  useEffect(() => {
    if (isListingRejected) {
      setLocalListingRejected(true);
    }
  }, [isListingRejected]);

  useEffect(() => {
    if (isListTraitLoading) {
      setLocalListingPending(true);
    }
  }, [isListTraitLoading]);

  //isCancelOfferChonkSuccess
  // useEffect(() => { // TODO
  //   if (isCancelOfferChonkSuccess) {
  //     setLocalCancelOfferChonkSuccess(true);
  //   }
  // }, [isCancelOfferChonkSuccess]);

  const { data: storedTrait } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "getTrait",
    args: [traitId],
    chainId,
  }) as { data: StoredTrait | undefined };

  const traitTypeId = storedTrait?.traitType;

  const { handleUnequipTrait, isUnequipTraitPending, hashUnequipTrait } =
    useUnequipTrait();

  function handleOfferSubmit() {
    console.log("minimumOffer", minimumOffer);
    console.log("offerAmount", offerAmount);

    if (hasActiveBid && traitBid && minimumOffer) {
      if (Number(offerAmount) < Number(minimumOffer)) {
        alert(
          `Your offer must be at least 5% higher than the current bid. Minimum offer: ${minimumOffer} ETH`
        );
        return;
      }
    }

    if (selectedChonkId === "") {
      alert("Please select a Chonk");
      return;
    }

    if (offerAmount) {
      handleBidOnTrait(traitId, parseInt(selectedChonkId), offerAmount);
    } else {
      alert("Please enter an amount, minimum offer: " + minimumOffer + " ETH");
      return;
    }

    setIsOfferModalOpen(false);
    setOfferAmount("");
    setIsPrivateListingExpanded(false);
    setAddressError("");
    setPriceError("");
  }

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
      handleListTraitToAddress(
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

  const renderOwnerActions = () => {};

  return (
    <>
      <div className="border border-black p-4 mb-4">
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
          // renderOwnerActions()
          <p>Owner Actions</p>
        ) : (
          <>
            <p>Buyer Actions</p>
          </>
          // <>{renderBuyerActions()}</>
        )}

        {ownedChonks && ownedChonks.length === 0 ? (
          <>
            <div className="flex flex-col">
              {/* <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold">{price} ETH</span>
              </div>
              <p className="text-red-500 text-[1.25vw]">
                You need to own a Chonk to buy or make an offer on this trait
                <br />
                <Link
                  className="text-chonk-blue underline"
                  href="/marketplace/chonks"
                  rel="noopener noreferrer"
                >
                  Go buy one here
                </Link>
              </p> */}
            </div>
          </>
        ) : hasActiveOffer ? (
          <>
            <div className="flex flex-col mb-4">
              <div className="flex items-baseline gap-2 mb-4">
                {isOwner && <div className="text-xl">Buy this Trait for</div>}
                {tbaOwner === address && (
                  <div className="text-xl">Trait is Listed for</div>
                )}
                <span className="text-2xl font-bold">{price} ETH</span>

                {/* <span className="text-gray-500"> */}
                {/* (${priceUSD.toLocaleString()})
                </span> */}
              </div>
              {isOfferSpecific && (
                <span className="text-sm text-gray-500">Private Listing</span>
              )}
            </div>

            {isOwner || tbaOwner === address ? (
              <div className="flex flex-col gap-2">
                <button
                  className="w-full bg-red-500 text-white py-2 px-4 hover:bg-red-600 transition-colors"
                  onClick={() =>
                    handleCancelOfferTrait(parseInt(tokenIdOfTBA ?? "0"))
                  }
                >
                  Cancel Listing
                </button>

                {hasActiveBid && traitBid && (
                  <button
                    className="w-full bg-chonk-orange text-white py-2 px-4 hover:bg-chonk-orange hover:text-black transition-colors"
                    onClick={() => handleAcceptBidForTrait(traitBid.bidder)}
                  >
                    Accept Offer of {formatEther(traitBid.amountInWei)} ETH
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  {/* {!isOfferSpecific || canAcceptOffer && ( */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select your chonk that the trait will transfer to
                    </label>
                    <select
                      value={selectedChonkId}
                      onChange={(e) => setSelectedChonkId(e.target.value)}
                      className="w-full text-sm font-medium  p-2 border  bg-white"
                    >
                      <option value="">Select a Chonk</option>
                      {ownedChonks?.map((chonk) => (
                        <option key={parseInt(chonk)} value={parseInt(chonk)}>
                          Chonk #{parseInt(chonk)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* )} */}

                  <button
                    className={`w-full py-2 px-4  transition-colors ${
                      (!isOfferSpecific || canAcceptOffer) &&
                      !hasInsufficientBalance &&
                      (!isOfferSpecific ? selectedChonkId : true)
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={Boolean(
                      (isOfferSpecific && !canAcceptOffer) ||
                        hasInsufficientBalance ||
                        (!isOfferSpecific && !selectedChonkId)
                    )}
                    onClick={() => {
                      if (price) {
                        // if (isOfferSpecific) {
                        //   // handleBuyTrait(price, parseInt(tokenIdOfTBA ?? "0"));
                        //   handleBuyTrait(price, parseInt(selectedChonkId));
                        // } else {
                        handleBuyTrait(price, parseInt(selectedChonkId));
                        // }
                      }
                    }}
                  >
                    {isOfferSpecific
                      ? canAcceptOffer
                        ? "Accept Private Offer"
                        : "Private Offer - Not For You"
                      : "Buy Now"}
                  </button>
                  {hasInsufficientBalance && (
                    <p className="text-red-500 text-sm mt-2">
                      Insufficient balance. You need at least{" "}
                      {price && (price + estimatedGasInEth).toFixed(4)} ETH
                      (including gas)
                    </p>
                  )}

                  {/* need to clean up the code, this is repeated below */}
                  {hasActiveBid && traitBid && traitBid.bidder === address ? (
                    <button
                      className="w-full bg-red-500 text-white py-2 px-4  hover:bg-red-600 transition-colors"
                      onClick={() => handleWithdrawBidOnTrait()}
                    >
                      Cancel Your Offer
                    </button>
                  ) : (
                    <>
                      <button
                        className="w-full bg-chonk-blue text-white py-2 px-4  hover:bg-chonk-orange hover:text-black transition-colors"
                        onClick={() => setIsOfferModalOpen(true)}
                      >
                        Make an Offer
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {hasActiveBid && traitBid && (
              <div className="text-lg text-gray-500 mb-4">
                <span className="text-gray-500">
                  Current Bid: {formatEther(traitBid.amountInWei)} ETH by{" "}
                  {address &&
                  getAddress(traitBid.bidder) === getAddress(address)
                    ? "You"
                    : truncateEthAddress(traitBid.bidder)}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {isOwner ||
                (tbaOwner === address && (
                  <>
                    <button
                      className="w-full bg-chonk-blue text-white py-2 px-4  hover:bg-chonk-orange hover:text-black transition-colors"
                      onClick={() => {
                        if (!TBAIsApproved) {
                          approveTBAForMarketplace();
                        } else {
                          if (isEquipped) {
                            handleUnequipTrait(chonkId, traitTypeId);
                          } else {
                            setIsModalOpen(true);
                          }
                        }
                      }}
                    >
                      {TBAIsApproved
                        ? isEquipped
                          ? "Unequip Trait to List"
                          : "List Your Trait"
                        : "Approve Marketplace to List Trait"}
                    </button>

                    {hasActiveBid && traitBid && (
                      <button
                        className="w-full bg-chonk-orange text-white py-2 px-4  hover:bg-chonk-orange hover:text-black transition-colors"
                        onClick={() => handleAcceptBidForTrait(traitBid.bidder)}
                      >
                        Accept Offer of {formatEther(traitBid.amountInWei)} ETH
                      </button>
                    )}
                  </>
                ))}

              {/* {!isOwner && tbaOwner !== address && ( */}
              {!isOwner && tbaOwner !== address && (
                <>
                  {hasActiveBid && traitBid && traitBid.bidder === address ? (
                    <button
                      className="w-full bg-red-500 text-white py-2 px-4  hover:bg-red-600 transition-colors"
                      onClick={() => handleWithdrawBidOnTrait()}
                    >
                      Cancel Your Offer
                    </button>
                  ) : (
                    <>
                      {!ownedChonks || ownedChonks.length === 0 ? (
                        <p className="text-red-500 text-[1.25vw]">
                          You need to own a Chonk to make an offer on this trait
                          <br />{" "}
                          <a
                            className="text-chonk-blue underline"
                            href="https://chonk.xyz/marketplace"
                            rel="noopener noreferrer"
                          >
                            {" "}
                            Go buy one here
                          </a>
                        </p>
                      ) : (
                        <button
                          className="w-full bg-chonk-blue text-white py-2 px-4  hover:bg-chonk-orange hover:text-black transition-colors"
                          onClick={() => setIsOfferModalOpen(true)}
                        >
                          Make an Offer
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Listing Modal */}
      {/* {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">List Trait #{traitId}</h2>

            <div>
              <label className="block mb-2">Price (ETH)</label>
              <input
                type="number"
                step={STEP_SIZE}
                min={MIN_LISTING_PRICE}
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                className="w-full p-2 border "
                placeholder="0.00"
              />
            </div>

            {priceError && (
              <p className="text-red-500 text-sm mt-1">{priceError}</p>
            )} */}

      {/* New Private Listing Section */}
      {/* <div className="mb-4 mt-4">
              <button
                className="flex items-center gap-2 text-left w-full"
                onClick={() =>
                  setIsPrivateListingExpanded(!isPrivateListingExpanded)
                }
              >
                <span>{isPrivateListingExpanded ? "▼" : "▶"}</span>
                Private Listing
              </button> */}

      {/* {isPrivateListingExpanded && (
                <div className="mt-2">
                  <label className="block mb-2">Recipient Address</label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => {
                      setRecipientAddress(e.target.value);
                      setAddressError("");
                    }}
                    className={`w-full p-2 border  ${
                      addressError ? "border-red-500" : ""
                    }`}
                    placeholder="0x... or name.eth"
                  />

                  {addressError && (
                    <p className="text-red-500 text-sm mt-1">{addressError}</p>
                  )}

                  {recipientAddress.endsWith(".eth") && (
                    <p className="text-gray-500 text-sm mt-1">
                      {!ensAddress
                        ? "Resolving ENS address..."
                        : `Resolved to: ${ensAddress}`}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 border border-black hover:bg-gray-100"
                onClick={() => {
                  setIsModalOpen(false);
                  setListingPrice("");
                  setRecipientAddress("");
                  setAddressError("");
                  setIsPrivateListingExpanded(false);
                  setPriceError("");
                }}
              >
                Cancel
              </button> */}
      {/* <button
                className="px-4 py-2 bg-black text-white hover:bg-gray-800"
                onClick={() => {
                  const listingPriceNum = Number(listingPrice);
                  if (listingPriceNum < Number(MIN_LISTING_PRICE)) {
                    setPriceError(
                      `Minimum listing price is ${MIN_LISTING_PRICE} ETH`
                    );
                    return;
                  }

                  if (isPrivateListingExpanded && !resolvedAddress) {
                    setAddressError("Please enter a valid address or ENS name");
                    return;
                  }

                  if (isPrivateListingExpanded && resolvedAddress) {
                    handleListTraitToAddress(
                      listingPrice,
                      parseInt(tokenIdOfTBA ?? "0"),
                      resolvedAddress
                    );
                  } else {
                    handleListTrait(
                      listingPrice,
                      parseInt(tokenIdOfTBA ?? "0")
                    );
                  }

                  setIsModalOpen(false);
                  setListingPrice("");
                  setRecipientAddress("");
                  setAddressError("");
                  setPriceError("");
                }}
              >
                {isPrivateListingExpanded && resolvedAddress
                  ? "Private List Trait"
                  : "List Trait"}
              </button>
            </div>
          </div>
        </div> */}
      {/* )} */}

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

      {/* Offer Modal */}
      {/* {isOfferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8  max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              Make an Offer for Trait #{traitId}
            </h2>

            {hasActiveBid && traitBid && (
              <div className="text-red-500 text-[1vw] mb-2">
                Current Bid: {formatEther(traitBid.amountInWei)} ETH
                <br />
                Minimum Offer: {minimumOffer} ETH
              </div>
            )}

            <div className="mb-4  text-[1vw]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select your chonk that the trait will transfer to if the offer
                is accepted
              </label>
              <select
                value={selectedChonkId}
                onChange={(e) => setSelectedChonkId(e.target.value)}
                className="w-full text-sm font-medium  p-2 border  bg-white"
              >
                <option value="">Select a Chonk</option>
                {ownedChonks?.map((chonk) => (
                  <option key={parseInt(chonk)} value={parseInt(chonk)}>
                    Chonk #{parseInt(chonk)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4   text-[1vw]">
              <label className="block mb-2">Offer Amount (ETH)</label>
              <input
                type="number"
                step={STEP_SIZE}
                min={MIN_LISTING_PRICE}
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="w-full p-2 border "
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 border border-black hover:bg-gray-100"
                onClick={() => {
                  setIsOfferModalOpen(false);
                  setOfferAmount("");
                }}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-black text-white hover:bg-gray-800"
                onClick={() => {
                  console.log("minimumOffer", minimumOffer);
                  console.log("offerAmount", offerAmount);
                  if (hasActiveBid && traitBid && minimumOffer) {
                    if (Number(offerAmount) < Number(minimumOffer)) {
                      alert(
                        `Your offer must be at least 5% higher than the current bid. Minimum offer: ${minimumOffer} ETH`
                      );
                      return;
                    }
                  }

                  if (selectedChonkId === "") {
                    alert("Please select a chonk");
                    return;
                  }

                  if (offerAmount) {
                    handleBidOnTrait(
                      traitId,
                      parseInt(selectedChonkId),
                      offerAmount
                    );
                  } else {
                    alert(
                      "Please enter an amount, minimum offer: " +
                        minimumOffer +
                        " ETH"
                    );
                    return;
                  }
                  setIsOfferModalOpen(false);
                  setOfferAmount("");
                }}
              >
                Create Offer
              </button>
            </div>
          </div>
        </div>
      )} */}

      <ModalWrapper
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
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
        />
      </ModalWrapper>
    </>
  );
}
