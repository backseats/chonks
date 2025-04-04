import { ChangeEvent, useEffect, useMemo, useState, useCallback } from "react";
import { MARKETPLACE_CONSTANTS } from "@/constants/marketplace";
import { Address, parseEther } from "viem";
import {
  usePublicClient,
  useWaitForTransactionReceipt,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { chainId } from "@/config";
import ErrorDisplay from "../../common/ErrorDisplay";

interface OfferModalProps {
  chonkId: number;
  traitId?: number;
  offerAmount: string;
  minimumOffer: string;
  hasActiveBid: boolean;
  currentBid?: {
    bidder: string;
    amountInWei: bigint;
  } | null;
  ownedChonks: string[];
  selectedChonkId?: string;
  priceError: string | null;
  chonkSelectError: string | null;
  address: Address;
  abi: any[];
  args: any[];
  value: bigint;
  functionName: string;
  inFlightLabel: string;
  setOfferAmount: (amount: string) => void;
  onClose: () => void;
  setSelectedChonkId?: (chonkId: string) => void;
  validateBid: () => boolean;
  onSuccess?: () => void;
  setError: (error: string | null) => void;
}

export const OfferModal = ({
  chonkId,
  traitId,
  offerAmount,
  setOfferAmount,
  minimumOffer,
  priceError,
  hasActiveBid,
  currentBid,
  onClose,
  ownedChonks,
  selectedChonkId,
  setSelectedChonkId,
  chonkSelectError,
  address,
  abi,
  args,
  functionName,
  value,
  inFlightLabel,
  validateBid,
  onSuccess,
  setError,
}: OfferModalProps) => {
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

  const handleCLick = async () => {
    let isBidValid = validateBid();
    if (!isBidValid) return;

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
        value,
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
    setOfferAmount(value);
  };

  const isDisabled = useMemo(() => {
    return isSimulating || isWriteContractPending || isWaiting;
  }, [isSimulating, isWriteContractPending, isWaiting]);

  const buttonLabel = useMemo(() => {
    if (isSimulating) return "Make Offer";
    if (isWriteContractPending) return "Confirm with your wallet";
    if (isWaiting) return inFlightLabel;
    return "Make Offer";
  }, [isSimulating, isWriteContractPending, isWaiting, inFlightLabel, traitId]);

  const validateOffer = useCallback(() => {
    let isValid = true;
    setError(null);
    setBottomError(null);

    if (traitId && !selectedChonkId) {
      setError("Please select the Chonk to receive the Trait.");
      isValid = false;
    }

    const offerAmountNum = Number(offerAmount);
    if (!offerAmount || isNaN(offerAmountNum) || offerAmountNum <= 0) {
      setError("Please enter a valid offer amount.");
      isValid = false;
    } else if (offerAmountNum < Number(minimumOffer)) {
      setError(
        `Offer must be at least ${minimumOffer} ETH${
          hasActiveBid ? " (min. 5% higher)" : ""
        }.`
      );
      isValid = false;
    }

    return isValid;
  }, [offerAmount, minimumOffer, hasActiveBid, selectedChonkId, setError]);

  const priceInWei = useMemo(() => {
    try {
      if (
        offerAmount &&
        !isNaN(Number(offerAmount)) &&
        Number(offerAmount) > 0
      ) {
        return parseEther(offerAmount);
      }
    } catch (e) {
      console.error("Error parsing offer amount:", e);
    }
    return 0n;
  }, [offerAmount]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[22px] font-bold">
        {traitId
          ? `Make an Offer for Trait #${traitId}`
          : `Make an Offer for Chonk #${chonkId}`}
      </h2>

      <div className="flex flex-col gap-2">
        {hasActiveBid && currentBid && (
          <div className="text-sm text-gray-600">
            Current Bid: {Number(currentBid.amountInWei) / 1e18} ETH
          </div>
        )}

        <label className="text-sm font-medium">Offer Amount (ETH)</label>
        <input
          type="number"
          step={MARKETPLACE_CONSTANTS.STEP_SIZE}
          min={MARKETPLACE_CONSTANTS.MIN_LISTING_PRICE}
          value={offerAmount}
          onChange={handlePriceChange}
          className="border p-2 text-[16px]"
          placeholder={minimumOffer}
          disabled={isDisabled}
        />

        {priceError && <ErrorDisplay error={priceError} />}
      </div>

      {traitId && ownedChonks.length === 0 && (
        <p className="text-red-500 text-[16px]">
          You need to own a Chonk to make an Offer on this Trait.{" "}
          <a
            className="text-chonk-blue underline"
            href="https://chonks.xyz/market"
            rel="noopener noreferrer"
          >
            Buy a Chonk here
          </a>
        </p>
      )}

      {traitId && ownedChonks.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-[16px]">
            Select your Chonk that the Trait will transfer to if the Offer is
            accepted
          </label>
          <select
            value={selectedChonkId}
            onChange={(e) => setSelectedChonkId?.(e.target.value)}
            className="border p-2 bg-white text-[16px]"
          >
            <option value="">Select a Chonk</option>
            {ownedChonks?.map((chonkId: string) => (
              <option key={parseInt(chonkId)} value={parseInt(chonkId)}>
                Chonk #{parseInt(chonkId)}
              </option>
            ))}
          </select>

          {chonkSelectError && <ErrorDisplay error={chonkSelectError} />}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex sm:flex-row flex-col gap-4 mt-4 text-[16px]">
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
            className={`flex-1 bg-chonk-blue text-white py-2 px-4 hover:brightness-110 disabled:opacity-50 text-[16px]`}
            onClick={handleCLick}
            disabled={isDisabled}
          >
            {buttonLabel}
          </button>
        </div>

        {bottomError && (
          <ErrorDisplay
            error={bottomError}
            className="text-center mt-2 -mb-4"
          />
        )}
      </div>
    </div>
  );
};
