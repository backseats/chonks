import { formatEther, Address, getAddress } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";
import Link from "next/link";

interface Props {
  amountInWei: bigint;
  bidder: string;
  address: Address | undefined;
  chonkId?: number;
}

export default function CurrentBid(props: Props) {
  const { amountInWei, bidder, address, chonkId } = props;

  return (
    <div className="text-[16px] text-gray-500 mb-[1.725vw]">
      <span className="text-black">
        <strong>Current Bid: {formatEther(amountInWei)} ETH</strong> from{" "}
        {address && getAddress(address) === getAddress(bidder)
          ? "You"
          : truncateEthAddress(bidder)}
      </span>

      {chonkId && (
        <Link href={`/chonks/${chonkId}`}>
          <div className="text-gray-500 text-sm">
            to be owned by Chonk #{chonkId}
          </div>
        </Link>
      )}
    </div>
  );
}
