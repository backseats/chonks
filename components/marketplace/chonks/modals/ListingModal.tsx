import { ChangeEvent, useEffect } from "react";
import { MARKETPLACE_CONSTANTS } from "@/constants/marketplace";

interface ListingModalProps {
  chonkId: number;
  traitId?: number;
  listingPrice: string;
  isPrivateListingExpanded: boolean;
  recipientAddress: string;
  addressError: string;
  priceError: string;
  status: {
    isRejected: boolean;
    isPending: boolean;
    isSuccess: boolean;
  };
  onSubmit: () => void;
  onClose: () => void;
  setListingPrice: (price: string) => void;
  setIsPrivateListingExpanded: (expanded: boolean) => void;
  setRecipientAddress: (address: string) => void;
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
  useEffect(() => {
    if (status.isRejected || (status.isSuccess && status.isPending)) {
      setListingPrice("");
      setRecipientAddress("");
      onClose();
    }
  }, [status]);

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
              disabled={status.isPending || status.isSuccess}
            />
            {addressError && (
              <span className="text-red-500 text-sm">{addressError}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          className="flex-1 bg-gray-200 py-2 px-4 hover:bg-gray-300"
          onClick={onClose}
          disabled={status.isPending && !status.isSuccess && !status.isRejected}
        >
          {status.isSuccess
            ? "Close"
            : status.isPending
            ? "Confirm with your wallet"
            : "Cancel"}
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
