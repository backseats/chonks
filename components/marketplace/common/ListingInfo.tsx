import { formatEther } from "viem";
import { FaEthereum } from "react-icons/fa";

interface Props {
  chonkOrTrait: "chonk" | "trait";
  id: number;
  price: string;
  traitName?: string;
}

export default function ListingInfo(props: Props) {
  const { chonkOrTrait, id, price, traitName } = props;

  return (
    <div className="p-4 text-[16px]">
      <h3 className="font-bold">
        {chonkOrTrait === "chonk"
          ? `Chonk #${id}`
          : traitName
          ? traitName
          : `Trait ${id}`}
      </h3>

      {price && (
        <div className="flex flex-row mt-2">
          <span>{formatEther(BigInt(price))}</span>
          <FaEthereum className="ml-1 mt-1 text-[16px]" />
        </div>
      )}
    </div>
  );
}
