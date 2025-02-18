import { useState, useMemo, useEffect } from "react";
import { useMarketplaceActions } from "@/hooks/marketplaceAndMintHooks";
import { useBalance, useAccount, useEnsAddress } from "wagmi";
import { parseEther, isAddress, formatEther } from "viem";
import { mainnet } from "wagmi/chains";
import { ConnectKitButton } from "connectkit";

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
  const [localListingRejected, setLocalListingRejected] = useState(false);
  const [localListingPending, setLocalListingPending] = useState(false);

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

  // let's initiall set offerAmount to the current bid amount
  useEffect(() => {
    if (hasActiveBid && chonkBid) {
      setOfferAmount(formatEther(chonkBid.amountInWei));
    }
  }, [hasActiveBid, chonkBid]);

  // useEffect(() => {
  //     if (isListChonkSuccess) {
  //         onListingSuccess?.();
  //     }
  // }, [isListChonkSuccess, onListingSuccess]);

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

  // Add this constant near the top of the component
  const MIN_LISTING_PRICE = 0.000001; // 1 millionth of an ETH

  // console.log('hasActiveOffer:', hasActiveOffer);
  // console.log('isListChonkSuccess:', isListChonkSuccess);

  return (
    <>
      <div className="border border-black p-[1.725vw] mb-[1.725vw]">
        {/* Has Offer, or just been Listed */}
        {(hasActiveOffer || isListChonkSuccess) &&
        !isCancelOfferChonkSuccess ? (
          <>
            <div className="flex flex-col mb-4">
              <div className="flex items-baseline gap-2">
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
              <div className="flex flex-col gap-2">
                <button
                  className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
                  onClick={handleCancelOfferChonk}
                >
                  Cancel Listing
                </button>

                {hasActiveBid && chonkBid && (
                  <button
                    className="w-full bg-chonk-orange text-white py-2 px-4 rounded hover:bg-chonk-orange hover:text-black transition-colors"
                    onClick={() => handleAcceptBidForChonk(chonkBid.bidder)}
                  >
                    Accept Offer of {formatEther(chonkBid.amountInWei)} ETH
                  </button>
                )}
              </div>
            ) : (
              <>
                <button
                  className={`w-full py-2 px-4 rounded transition-colors ${
                    (!isOfferSpecific || canAcceptOffer) &&
                    !hasInsufficientBalance
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={Boolean(
                    (isOfferSpecific && !canAcceptOffer) ||
                      hasInsufficientBalance
                  )}
                  onClick={() => {
                    console.log("Buy Now clicked, price:", price);
                    if (price) {
                      console.log("Calling handleBuyChonk with price:", price);
                      handleBuyChonk(price);
                    } else {
                      console.log("Price is null or undefined");
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
                    className="w-full bg-chonk-blue text-white py-2 px-4 rounded hover:bg-chonk-orange hover:text-black transition-colors"
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
                      className="w-full bg-chonk-orange text-white py-2 px-4 hover:bg-chonk-orange hover:text-black transition-colors"
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
                        className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
                        onClick={() => handleWithdrawBidOnChonk()}
                      >
                        Cancel Your Offer
                      </button>
                    ) : (
                      <button
                        className="w-full bg-chonk-blue text-white py-2 px-4 rounded hover:bg-chonk-orange hover:text-black transition-colors"
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

      {/* Listing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-[5px]">
          <div className="bg-white p-8 max-w-md w-full mx-4 min-w-[25vw]">
            {localListingRejected ? (
              <div>
                <div className="text-red-500 text-[1.725vw] mb-2 font-bold">
                  Transaction Rejected
                </div>
                <div className="text-[1vw] mb-6">I feel rejected :(</div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setListingPrice("");
                    setRecipientAddress("");
                    setPriceError("");
                    setAddressError("");
                    setLocalListingRejected(false);
                    setLocalListingPending(false);
                  }}
                  className="mb-2 bg-white text-black border border-black px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : isListChonkSuccess ? (
              <>
                <div className="text-green-500 text-[1.725vw] mb-2">
                  Success - Listed!
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="mb-4bg-white text-black border border-black px-4 py-2 text-[0.69vw] hover:bg-gray-100 transition-colors mt-[1.725vw]"
                >
                  Close
                </button>
              </>
            ) : hashListChonk ? (
              <>
                {isListChonkError ? (
                  <>
                    <div className="text-red-500 text-[1.725vw] mb-2 font-bold">
                      Error!
                    </div>
                    <div className="text-[vw] mb-2">
                      There&apos;s been an error with your transaction. Please
                      try again.
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="mb-6 bg-white text-black border border-black px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-black text-[1.725vw] mb-2">
                      Transaction Submitted
                    </div>
                    <div className="text-[1vw]">Checking mint status{dots}</div>
                  </>
                )}

                <div className="text-sm mt-4 break-all max-w-[80%]">
                  <button
                    onClick={() =>
                      window.open(
                        `https://basescan.org/tx/${hashListChonk}`,
                        "_blank"
                      )
                    }
                    className="bg-white text-black border border-black px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                  >
                    View on Basescan
                  </button>
                </div>
              </>
            ) : localListingPending ? (
              <div>
                <div className="text-black text-[1.725vw] mb-2">
                  Confirm in Wallet
                </div>
                <div className="text-[1vw]">Requesting signature{dots}</div>
              </div>
            ) : (
              // LIST FORM
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  List Chonk #{chonkId}
                </h2>

                <div className="mb-4">
                  <label className="block mb-2">Price (ETH)</label>
                  <input
                    type="number"
                    step="0.000001"
                    min="0.000001"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    className="w-full p-2 border rounded"
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
                        className={`w-full p-2 border rounded ${
                          addressError ? "border-red-500" : ""
                        }`}
                        placeholder="0x... or name.eth"
                      />
                      {addressError && (
                        <p className="text-red-500 text-sm mt-1">
                          {addressError}
                        </p>
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

                {priceError && listingPrice === "" && (
                  <div className="mb-4 text-red-500 text-sm mt-1">
                    {priceError}
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <button
                    className="px-4 py-2 border border-black hover:bg-gray-100"
                    onClick={() => {
                      setIsModalOpen(false);
                      setListingPrice("");
                      setRecipientAddress("");
                      setAddressError("");
                      setPriceError("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-black text-white hover:bg-gray-800"
                    onClick={() => {
                      const listingPriceNum = Number(listingPrice);
                      if (listingPriceNum < MIN_LISTING_PRICE) {
                        setPriceError(
                          `Minimum listing price is ${MIN_LISTING_PRICE} ETH`
                        );
                        return;
                      }

                      if (isPrivateListingExpanded && !resolvedAddress) {
                        setAddressError(
                          "Please enter a valid address or ENS name"
                        );
                        return;
                      }

                      if (isPrivateListingExpanded && resolvedAddress) {
                        handleListChonkToAddress(listingPrice, resolvedAddress);
                      } else {
                        handleListChonk(listingPrice);
                      }

                      setLocalListingPending(true);
                    }}
                  >
                    {isPrivateListingExpanded && resolvedAddress
                      ? "Private List Chonk"
                      : "List Chonk"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-[5px]">
          <div className="bg-white p-8   max-w-md w-full mx-4">
            <h2 className="text-[1.25vw] font-bold mb-4">
              Make an Offer for Chonk #{chonkId}
            </h2>

            <div className="mb-4 text-[1vw]">
              {hasActiveBid && chonkBid && chonkBid.bidder === address ? (
                // shouldn't hit this as it will show Cancel Your Offer button
                <div className="text-red-500 text-[1vw] mb-2">
                  You already have an active bid on this chonk
                </div>
              ) : (
                <>
                  {hasActiveBid && chonkBid && (
                    <div className="text-red-500 text-[1vw] mb-2">
                      Current Bid: {formatEther(chonkBid.amountInWei)} ETH
                    </div>
                  )}
                  <label className="block mb-2">Offer Amount (ETH)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="0.00"
                  />
                </>
              )}
            </div>

            <div className="flex justify-end space-x-4 text-[1vw]">
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
                  // Check if there's an active bid and if the new offer amount is greater than the current bid
                  if (
                    hasActiveBid &&
                    chonkBid &&
                    Number(offerAmount) <=
                      Number(formatEther(chonkBid.amountInWei))
                  ) {
                    alert(
                      `Your offer must be greater than the current bid of ${formatEther(
                        chonkBid.amountInWei
                      )} ETH.`
                    );
                    return;
                  }

                  if (offerAmount) {
                    handleBidOnChonk(chonkId, offerAmount);
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
