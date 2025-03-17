import { formatEther } from "viem";
import { FaEthereum } from "react-icons/fa";

interface Props {
  chonkOrTrait: "chonk" | "trait";
  id: number;
  price: string;
}

export default function ListingInfo(props: Props) {
  const { chonkOrTrait, id, price } = props;

  return (
    <div className="p-4 text-[16px]">
      <h3 className="font-bold">
        {chonkOrTrait === "chonk" ? "Chonk" : "Trait"} #{id}
      </h3>

      <div className="flex flex-row mt-2">
        <span>{formatEther(BigInt(price))}</span>
        <FaEthereum className="ml-1 mt-1 text-[16px]" />
      </div>
    </div>
  );
}
