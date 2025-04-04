import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { MARKETPLACE_CONSTANTS } from "@/constants/marketplace";
import { Address } from "viem";
import {
  useWriteContract,
  useWalletClient,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { chainId } from "@/config";

interface ListingModalProps {
  chonkId: number;
  traitId?: number;
  listingPrice: string;
  isPrivateListingExpanded: boolean;
  recipientAddress: string;
  addressError: string;
  priceError: string;
  address: Address;
  abi: any[];
  args: any[];
  functionName: string;
  inFlightLabel: string;
  onClose: () => void;
  setListingPrice: (price: string) => void;
  setIsPrivateListingExpanded: (expanded: boolean) => void;
  setRecipientAddress: (address: string) => void;
  onSuccess?: () => void;
  validateListing: () => boolean;
}

export const ListingModal = (props: ListingModalProps) => {
  const {
    chonkId,
    traitId,
    listingPrice,
    setListingPrice,
    isPrivateListingExpanded,
    setIsPrivateListingExpanded,
    recipientAddress,
    setRecipientAddress,
    addressError,
    priceError,
    onClose,
    address,
    abi,
    args,
    functionName,
    inFlightLabel,
    onSuccess,
    validateListing,
  } = props;

  const [isSimulating, setIsSimulating] = useState(false);
  const [bottomError, setBottomError] = useState<string | null>(null);

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId });

  const {
    writeContract,
    data: writeContractHash,
    isPending: isWriteContractPending,
    error: writeContractError,
  } = useWriteContract();

  const {
    data: receipt,
    isLoading: isWaiting,
    error: waitingError,
  } = useWaitForTransactionReceipt({
    hash: writeContractHash,
  });

  const processError = (error: string) => {
    if (error.includes("User denied transaction signature")) {
      setBottomError("Confirm the transaction to continue");
    } else if (error.includes("MustWaitToWithdrawBid")) {
      // TODO: get the block from the contract and make it more dynamic
      setBottomError("Wait one minute before withdrawing your Bid");
    } else if (error.includes("CantBeZero")) {
      setBottomError(null); // handled elsewhere
    } else {
      setBottomError(error);
    }
  };

  const handleClick = async () => {
    let isValid = validateListing();
    if (!isValid) return;

    setBottomError(null);
    setIsSimulating(true);

    try {
      // Must connect wallet. Should never hit this
      if (!walletClient) {
        return;
      }

      const simulation = await publicClient?.simulateContract({
        address: address,
        abi,
        functionName,
        args,
        account: walletClient.account!,
      });

      if (!simulation) {
        setBottomError("Simulation failed");
        return;
      }

      await writeContract(simulation.request);
    } catch (err: any) {
      processError(err.message || "Simulation or transaction failed");
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    if (receipt) onSuccess?.();
  }, [receipt]);

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setListingPrice(value);
  };

  const isDisabled = useMemo(() => {
    return isSimulating || isWriteContractPending || isWaiting;
  }, [isSimulating, isWriteContractPending, isWaiting]);

  const buttonLabel = useMemo(() => {
    if (isSimulating) return traitId ? "List Trait" : "List Chonk";
    if (isWriteContractPending) return "Confirm with your wallet";
    if (isWaiting) return inFlightLabel;
    return traitId ? "List Trait" : "List Chonk";
  }, [isSimulating, isWriteContractPending, isWaiting, inFlightLabel, traitId]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[22px] font-bold">
        {traitId ? `List Trait #${traitId}` : `List Chonk #${chonkId}`}
      </h2>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600">Price (ETH)</label>
        <input
          type="number"
          step={MARKETPLACE_CONSTANTS.STEP_SIZE}
          min={MARKETPLACE_CONSTANTS.MIN_LISTING_PRICE}
          value={listingPrice}
          onChange={handlePriceChange}
          className="border p-2 text-sm"
          placeholder="0.00"
          disabled={isDisabled}
        />

        {priceError && (
          <span className="text-red-500 text-sm">{priceError}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          className="text-left text-sm text-gray-600 underline"
          onClick={() => setIsPrivateListingExpanded(!isPrivateListingExpanded)}
          disabled={isDisabled}
        >
          Make it a {isPrivateListingExpanded ? "public" : "private"} listing
        </button>

        {isPrivateListingExpanded && (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="border p-2 text-sm"
              placeholder="Recipient address or ENS"
              disabled={isDisabled}
            />

            {addressError && (
              <span className="text-red-500 text-sm">{addressError}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex sm:flex-row flex-col gap-2 mt-4">
          {!isWriteContractPending && !isWaiting && (
            <button
              className="flex-1 bg-gray-200 py-2 px-4 hover:bg-gray-300 text-[16px] disabled:opacity-50"
              onClick={onClose}
              disabled={isDisabled}
            >
              Cancel
            </button>
          )}

          <button
            className="flex-1 bg-chonk-blue text-white py-2 px-4 hover:brightness-110 disabled:opacity-50 text-[16px]"
            onClick={handleClick}
            disabled={isDisabled}
          >
            {buttonLabel}
          </button>
        </div>

        {bottomError && (
          <span className="text-red-500 text-sm text-center mt-2 -mb-4">
            {bottomError}
          </span>
        )}
      </div>
    </div>
  );
};
