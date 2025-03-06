import { ChangeEvent } from 'react';
import { MARKETPLACE_CONSTANTS } from '@/constants/marketplace';

interface OfferModalProps {
  chonkId: number;
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
}

export const OfferModal = ({
  chonkId,
  offerAmount,
  setOfferAmount,
  minimumOffer,
  hasActiveBid,
  currentBid,
  onSubmit,
  onClose
}: OfferModalProps) => {
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setOfferAmount(value);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Make an Offer for Chonk #{chonkId}</h2>

      <div className="flex flex-col gap-2">
        {hasActiveBid && currentBid && (
          <div className="text-sm text-gray-600">
            Current highest offer: {Number(currentBid.amountInWei) / 1e18} ETH
          </div>
        )}

        <label className="text-sm font-medium">
          Offer Amount (ETH) - Minimum: {minimumOffer} ETH
        </label>
        <input
          type="number"
          step={MARKETPLACE_CONSTANTS.STEP_SIZE}
          min={MARKETPLACE_CONSTANTS.MIN_LISTING_PRICE}
          value={offerAmount}
          onChange={handleAmountChange}
          className="border p-2"
          placeholder={minimumOffer}
        />
      </div>

      <div className="flex gap-2 mt-4">
        <button
          className="flex-1 bg-gray-200 py-2 px-4 hover:bg-gray-300"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="flex-1 bg-chonk-blue text-white py-2 px-4 hover:brightness-110"
          onClick={onSubmit}
        >
          Make Offer
        </button>
      </div>
    </div>
  );
};
