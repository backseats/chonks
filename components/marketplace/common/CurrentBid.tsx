import { formatEther, Address, getAddress } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";

interface Props {
  amountInWei: bigint;
  bidder: string;
  address: Address | undefined;
}

export default function CurrentBid(props: Props) {
  const { amountInWei, bidder, address } = props;

  return (
    <div className="text-[16px] text-gray-500 mb-[1.725vw]">
      <span className="text-black">
        <strong>Current Bid: {formatEther(amountInWei)} ETH</strong> from{" "}
        {address && getAddress(address) === getAddress(bidder)
          ? "You"
          : truncateEthAddress(bidder)}
      </span>
    </div>
  );
}
