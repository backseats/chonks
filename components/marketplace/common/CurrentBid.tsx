import { formatEther } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";

interface Props {
  amountInWei: bigint;
  bidder: string;
}

export default function CurrentBid({ amountInWei, bidder }: Props) {
  return (
    <div className="text-[1vw] text-gray-500 mb-[1.725vw]">
      <span className="text-black text-md">
        <strong>Current Bid: {formatEther(amountInWei)} ETH</strong> from{" "}
        {truncateEthAddress(bidder)}
      </span>
    </div>
  );
}
