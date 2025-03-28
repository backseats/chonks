import { ChangeEvent } from "react";
import { MARKETPLACE_CONSTANTS } from "@/constants/marketplace";

interface OfferModalProps {
  chonkId: number;
  traitId?: number;
  offerAmount: string;
  setOfferAmount: (amount: string) => void;
  minimumOffer: string;
  hasActiveBid: boolean;
  currentBid?: {
    bidder: string;
    amountInWei: bigint;
  } | null;
  onSubmit: () => void;
  onClose: () => void;
  ownedChonks: string[];
  selectedChonkId?: string;
  setSelectedChonkId?: (chonkId: string) => void;
  priceError: string | null;
  isBidPending: boolean;
  chonkSelectError: string;
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
  onSubmit,
  onClose,
  ownedChonks,
  selectedChonkId,
  setSelectedChonkId,
  isBidPending,
  chonkSelectError,
}: OfferModalProps) => {
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setOfferAmount(value);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">
        {traitId
          ? `Make an Offer for Trait #${traitId}`
          : `Make an Offer for Chonk #${chonkId}`}
      </h2>

      <div className="flex flex-col gap-2">
        {hasActiveBid && currentBid && (
          <div className="text-sm text-gray-600">
            Current highest offer: {Number(currentBid.amountInWei) / 1e18} ETH
          </div>
        )}

        <label className="text-sm font-medium">Offer Amount (ETH)</label>
        <input
          type="number"
          step={MARKETPLACE_CONSTANTS.STEP_SIZE}
          min={MARKETPLACE_CONSTANTS.MIN_LISTING_PRICE}
          value={offerAmount}
          onChange={handleAmountChange}
          className="border p-2 text-[16px]"
          placeholder={minimumOffer}
        />

        {priceError && <div className="text-red-500 text-sm">{priceError}</div>}
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
          {chonkSelectError.length > 0 && (
            <div className="text-red-500 text-sm">{chonkSelectError}</div>
          )}
        </div>
      )}

      <div className="flex gap-4 mt-4 text-[16px]">
        {!isBidPending && (
          <button
            className="flex-1 bg-gray-200 py-2 px-4 hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
        )}

        <button
          className={`flex-1 bg-chonk-blue text-white py-2 px-4 hover:brightness-110 ${
            isBidPending ? "opacity-50" : ""
          }`}
          onClick={onSubmit}
          disabled={isBidPending}
        >
          {isBidPending ? "Confirm with your wallet" : "Make Offer"}
        </button>
      </div>
    </div>
  );
};
