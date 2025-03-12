import { formatEther } from "viem";

interface Props {
  amountInWei: bigint;
  bidder: string;
  action: (bidder: string) => void;
  isPending: boolean;
}

export default function AcceptOfferButton({
  amountInWei,
  bidder,
  action,
  isPending,
}: Props) {
  return (
    <button
      className={`w-full bg-chonk-orange text-white py-2 px-4 hover:brightness-110 transition-colors ${
        isPending ? "opacity-50" : ""
      }`}
      onClick={() => action(bidder)}
    >
      {isPending
        ? "Confirm with your wallet"
        : `Accept Offer of ${formatEther(amountInWei)} ETH`}
    </button>
  );
}
