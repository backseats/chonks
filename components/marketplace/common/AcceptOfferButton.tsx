import { formatEther } from "viem";

interface Props {
  amountInWei: bigint;
  bidder: string;
  action: (bidder: string) => void;
}

export default function AcceptOfferButton({
  amountInWei,
  bidder,
  action,
}: Props) {
  return (
    <button
      className="w-full bg-chonk-orange text-white py-2 px-4 hover:brightness-110 transition-colors"
      onClick={() => action(bidder)}
    >
      Accept Offer of {formatEther(amountInWei)} ETH
    </button>
  );
}
