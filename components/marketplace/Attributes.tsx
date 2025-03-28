import { useState } from "react";
import Link from "next/link";
import { traitsABI, traitsContract, chainId } from "@/config";
import { useReadContract } from "wagmi";
import ChonkRenderer from "../ChonkRenderer";
import { getCategoryString } from "@/types/Category";

// Later we can add floor prices here for other stuff
{
  /*
  <div className="flex flex-col justify-between text-[0.8vw] text-gray-600 mb-4 gap-2">
    <div>193 (2%)</div>
    <div className="underline">Buy It Now for 0.4 ETH</div>
    TODO, price. should link to trait category /traits/:category/:name
  </div>
*/
}

type Trait = {
  id: string;
  traitName: string;
  traitType: number; // Category id
};

export const Attributes = ({ attributes }: { attributes: Trait[] }) => {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      {attributes.map((attribute: Trait) => (
        <Attribute
          key={attribute.id}
          tokenId={parseInt(attribute.id)}
          traitType={attribute.traitType}
          value={attribute.traitName}
        />
      ))}
    </div>
  );
};

export default Attributes;

const Attribute = ({
  tokenId,
  traitType,
  value,
}: {
  tokenId: number;
  traitType: number;
  value: string;
}) => {
  const abi = [
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_tokenId",
          type: "uint256",
        },
      ],
      name: "getColorMapForTokenId",
      outputs: [
        {
          internalType: "bytes",
          name: "",
          type: "bytes",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  const { data, isLoading } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "getColorMapForTokenId",
    args: [tokenId],
    chainId,
  });

  const colorMap = data ? data.toString().substring(2) : null;

  const [showPreview, setShowPreview] = useState(false);

  return (
    <div
      className="border border-black p-2 sm:p-3 relative"
      key={tokenId}
      onMouseEnter={() => {
        if (isLoading) return;
        setShowPreview(true);
      }}
      onMouseLeave={() => {
        if (isLoading) return;
        setShowPreview(false);
      }}
    >
      <div className="text-sm text-gray-600">
        {getCategoryString(traitType)}
      </div>

      <Link
        href={`/market/traits/${tokenId}`}
        className="text-[16px] font-bold mb-2 underline"
      >
        {value}
      </Link>

      {showPreview && colorMap && (
        <div
          className="absolute z-10 w-[150px] h-[150px]"
          style={{ top: "-160px", left: "50%", transform: "translateX(-50%)" }}
        >
          <ChonkRenderer
            bytes={colorMap}
            backgroundColor="#0F6E9D"
            backgroundBody="ghost.svg"
          />
        </div>
      )}
    </div>
  );
};
