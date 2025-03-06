import { ChangeEvent } from "react";
import { MARKETPLACE_CONSTANTS } from "@/constants/marketplace";

interface ListingModalProps {
  chonkId: number;
  traitId?: number;
  listingPrice: string;
  setListingPrice: (price: string) => void;
  isPrivateListingExpanded: boolean;
  setIsPrivateListingExpanded: (expanded: boolean) => void;
  recipientAddress: string;
  setRecipientAddress: (address: string) => void;
  addressError: string;
  priceError: string;
  onSubmit: () => void;
  onClose: () => void;
  status: {
    isRejected: boolean;
    isPending: boolean;
    isSuccess: boolean;
    hash?: string;
  };
}

export const ListingModal = ({
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
  onSubmit,
  onClose,
  status,
}: ListingModalProps) => {
  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setListingPrice(value);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">
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
          disabled={status.isPending || status.isSuccess}
        />
        {priceError && (
          <span className="text-red-500 text-sm">{priceError}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          className="text-left text-sm text-gray-600 underline"
          onClick={() => setIsPrivateListingExpanded(!isPrivateListingExpanded)}
        >
          {isPrivateListingExpanded
            ? "Make Public Listing"
            : "Make Private Listing"}
        </button>

        {isPrivateListingExpanded && (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="border p-2 text-sm"
              placeholder="Recipient address or ENS"
              disabled={status.isPending || status.isSuccess}
            />
            {addressError && (
              <span className="text-red-500 text-sm">{addressError}</span>
            )}
          </div>
        )}
      </div>

      {status.isRejected && (
        <div className="text-red-500 text-sm">
          Transaction rejected. Please try again.
        </div>
      )}

      {status.isPending && !status.isSuccess && (
        <div className="text-blue-500 text-sm">Transaction pending...</div>
      )}

      {status.isSuccess && (
        <div className="text-green-500 text-sm">
          Successfully listed!
          {status.hash && (
            <a
              href={`https://basescan.io/tx/${status.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline ml-2"
            >
              View on Basescan
            </a>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          className="flex-1 bg-gray-200 py-2 px-4 hover:bg-gray-300"
          onClick={onClose}
        >
          {status.isSuccess ? "Close" : "Cancel"}
        </button>

        {!status.isSuccess && !status.isPending && !status.isRejected && (
          <button
            className="flex-1 bg-chonk-blue text-white py-2 px-4 hover:brightness-110 disabled:opacity-50"
            onClick={onSubmit}
            disabled={status.isPending || status.isSuccess}
          >
            {traitId ? "List Trait" : "List Chonk"}
          </button>
        )}
      </div>
    </div>
  );
};
