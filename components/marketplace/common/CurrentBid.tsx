import { formatEther, Address, getAddress } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";

interface Props {
  amountInWei: bigint;
  bidder: string;
  address: Address | undefined;
}

export default function CurrentBid({ amountInWei, bidder, address }: Props) {
  return (
    <div className="text-[1vw] text-gray-500 mb-[1.725vw]">
      <span className="text-black text-md">
        <strong>Current Bid: {formatEther(amountInWei)} ETH</strong> from{" "}
        {address && getAddress(address) === getAddress(bidder)
          ? "You"
          : truncateEthAddress(bidder)}
      </span>
    </div>
  );
}
