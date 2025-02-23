import { useState, useMemo } from "react";
import { useMarketplaceActions } from "@/hooks/marketplace/traits/marketplaceAndMintHooks";
import { useBalance, useAccount, useEnsAddress } from "wagmi";
import { parseEther, isAddress, formatEther } from "viem";
import { mainnet } from "wagmi/chains"; // mainnet for ens lookup
import { useOwnedChonks } from "@/hooks/useOwnedChonks";

import { useTBAApprovalWrite } from "@/hooks/useTBAApprovalWrite";
import {
  useReadEOAApproval,
  useReadTBAApproval,
} from "@/hooks/useApprovalRead";

type PriceAndActionsSectionProps = {
  isOwner: boolean;
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
  isEquipped: boolean | undefined;
  tbaAddress: string | null;
};

export default function PriceAndActionsSection(
  props: PriceAndActionsSectionProps
) {
  const {
    isOwner,
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
    handleAcceptBidForTrait
  } = useMarketplaceActions(traitId);

  const { TBAIsApproved } = useReadTBAApproval(tbaAddress as `0x${string}`);

  const { approveTBAForMarketplace } = useTBAApprovalWrite(
    tbaAddress as `0x${string}`
  );

  const [isPrivateListingExpanded, setIsPrivateListingExpanded] =
    useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");

  const [selectedChonkId, setSelectedChonkId] = useState<string>("");
  const { ownedChonks } = useOwnedChonks(address); // This hook should fetch owned Chonks

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
    return isValidAddress ? recipientAddress : undefined;
  }, [recipientAddress, ensAddress, isValidAddress]);

  // Calculate if balance is sufficient (price + estimated gas)
  const estimatedGasInEth = 0.0002; // Rough estimate // Deploy: check what this could be set to!?
  const hasInsufficientBalance =
    price &&
    balance &&
    balance.value < parseEther((price + estimatedGasInEth).toString());

  return (
    <>
      <div className="border border-black p-4 mb-4">
        {hasActiveOffer ? (
          <>
            <div className="flex flex-col mb-4">
              <div className="flex items-baseline gap-2 mb-4">
                {isOwner && (
                  <div className="text-xl">Buy this Trait for</div>
                )}
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
                    Select the chonk that the trait will transfer to
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
                    <button
                      className="w-full bg-chonk-blue text-white py-2 px-4  hover:bg-chonk-orange hover:text-black transition-colors"
                      onClick={() => setIsOfferModalOpen(true)}
                    >
                      Make an Offer
                      </button>
                  )
                }
              </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="text-lg text-gray-500 mb-4">
              Not Listed
              {hasActiveBid && traitBid && (
                <span className="text-gray-500">
                  {" "}
                  | Current Bid: {formatEther(traitBid.amountInWei)} ETH
                </span>
              )}
            </div>
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
                          setIsModalOpen(true);
                        }
                      }}
                    >
                      {TBAIsApproved
                        ? "List Your Trait"
                        : "Approve Marketplace to List Trait"}
                    </button>

                    {hasActiveBid && traitBid && (
                      <button
                        className="w-full bg-chonk-orange text-white py-2 px-4  hover:bg-chonk-orange hover:text-black transition-colors"
                        onClick={() =>
                          handleAcceptBidForTrait(traitBid.bidder)
                        }
                      >
                        Accept Offer of {formatEther(traitBid.amountInWei)} ETH
                      </button>
                    )}
                  </>
                ))}
              {/* {!isOwner && tbaOwner !== address && ( */}
              {!isOwner && tbaOwner !== address &&  (

              <>
                {hasActiveBid && traitBid && traitBid.bidder === address ? (
                    <button
                      className="w-full bg-red-500 text-white py-2 px-4  hover:bg-red-600 transition-colors"
                      onClick={() => handleWithdrawBidOnTrait()}
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
                  )
                }
              </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Listing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">List Trait #{traitId}</h2>

            <div className="mb-4">
              <label className="block mb-2">Price (ETH)</label>
              <input
                type="number"
                min="0.0001"
                step="0.0001"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                className="w-full p-2 border "
                placeholder="0.00"
              />
            </div>

            {/* New Private Listing Section */}
            <div className="mb-4">
              <button
                className="flex items-center gap-2 text-left w-full"
                onClick={() =>
                  setIsPrivateListingExpanded(!isPrivateListingExpanded)
                }
              >
                <span>{isPrivateListingExpanded ? "▼" : "▶"}</span>
                Private Listing
              </button>

              {isPrivateListingExpanded && (
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
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-black text-white hover:bg-gray-800"
                onClick={() => {
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
                }}
              >
                {isPrivateListingExpanded && resolvedAddress
                  ? "Private List Trait"
                  : "List Trait"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8  max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">
              Make an Offer for Trait #{traitId}
            </h2>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select the chonk that the trait will transfer to if the offer is accepted
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

            <div className="mb-4">
              <label className="block mb-2">Offer Amount (ETH)</label>
              <input
                type="number"
                step="0.000001"
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
                  if (offerAmount) {
                    handleBidOnTrait(traitId, parseInt(selectedChonkId), offerAmount);
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
      )}
    </>
  );
}
