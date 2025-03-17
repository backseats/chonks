import { FaEthereum } from "react-icons/fa6";
import { formatEther } from "viem";

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }

  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }

  return num.toString();
};

export default function Stats({
  name,
  floorPrice,
  onSale,
  totalAmount,
  owners,
  bestOffer,
}: {
  name: string;
  floorPrice: number;
  onSale: number;
  totalAmount: number;
  owners: number;
  bestOffer: number;
}) {
  return (
    <section
      className={`mpStats  border-l border-r flex flex-col bg-white py-[3.45vw]`}
    >
      {/* borderTopFull */}
      <div className="col-span-full flex flex-row flex-wrap gap-[3.45vw] justify-center">
        <div className="w-auto flex flex-row space-x-8 border border-black p-4 bg-gray-100">
          <h2 className="flex flex-col px-8 border-r border-gray-300">
            <span className="text-sm mb-1">Buy It Now</span>
            <span className="text-[1.5vw] flex items-center">
              {formatEther(BigInt(floorPrice))}{" "}
              <FaEthereum className="ml-1 text-[1vw]" />
            </span>
          </h2>

          <h2 className="flex flex-col px-8 border-r border-gray-300">
            <span className="text-sm mb-1">On Sale</span>
            <span className="text-[1.5vw]">
              {onSale}/{totalAmount.toLocaleString()}
            </span>
          </h2>

          {/* <h2 className="flex flex-col px-8 border-r border-gray-300">
            <span className="text-sm mb-1">Owners</span>
            <span className="text-[1.5vw]">{owners}</span>
          </h2> */}

          <h2 className="flex flex-col px-8">
            <span className="text-sm mb-1">Best Offer</span>
            <span className="text-[1.5vw] flex items-center">
              --{/* {bestOffer} <FaEthereum className="ml-1 text-[1vw]" /> */}
            </span>
          </h2>
        </div>
      </div>
    </section>
  );
}
