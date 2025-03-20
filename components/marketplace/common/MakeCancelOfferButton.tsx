interface Props {
  hasOffer: boolean;
  isMakeOfferPending: boolean;
  isWithdrawBidPending: boolean;
  handleSubmit: () => void;
  handleWithdrawBid: () => void;
}

export default function MakeCancelOfferButton({
  hasOffer,
  handleSubmit,
  isMakeOfferPending,
  isWithdrawBidPending,
  handleWithdrawBid,
}: Props) {
  const baseStyle = "w-full text-[18px] py-2 px-4 transition-colors text-white";
  const makeOfferStyle = `${baseStyle} ${
    isMakeOfferPending
      ? "bg-chonk-blue opacity-50"
      : "bg-chonk-blue hover:bg-chonk-orange hover:text-black"
  }`;

  const baseCancelStyle =
    "w-full py-2 px-4 transition-colors text-white bg-red-500";
  const cancelOfferStyle = `${baseCancelStyle} ${
    isWithdrawBidPending ? "opacity-50" : "hover:bg-red-600"
  }`;

  if (hasOffer) {
    return (
      <button
        className={cancelOfferStyle}
        onClick={handleWithdrawBid}
        disabled={isWithdrawBidPending}
      >
        {isWithdrawBidPending
          ? "Confirm with your wallet"
          : "Cancel your Offer"}
      </button>
    );
  }

  return (
    <button
      className={makeOfferStyle}
      onClick={handleSubmit}
      disabled={isMakeOfferPending}
    >
      Make an Offer
    </button>
  );
}
