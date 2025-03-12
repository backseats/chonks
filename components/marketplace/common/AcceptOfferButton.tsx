import { formatEther } from "viem";

interface Props {
  amountInWei: bigint;
  bidder: string;
  handleAcceptBidForChonk: (bidder: string) => void;
  isPending: boolean;
}

export default function AcceptOfferButton({
  amountInWei,
  bidder,
  handleAcceptBidForChonk,
  isPending,
}: Props) {
  return (
    <button
      className={`w-full bg-chonk-orange text-white py-2 px-4 hover:brightness-110 transition-colors ${
        isPending ? "opacity-50" : ""
      }`}
      onClick={() => handleAcceptBidForChonk(bidder)}
    >
      {isPending
        ? "Confirm with your wallet"
        : `Accept Offer of ${formatEther(amountInWei)} ETH`}
    </button>
  );
}
