import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  traitsABI,
  traitsContract,
  chainId,
  colorMapABI,
  colorMapContract,
} from "@/config";
import { useReadContract } from "wagmi";
import ChonkRenderer from "../ChonkRenderer";
import { getCategoryString } from "@/types/Category";
import { GET_TRAIT_COUNT } from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";

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

export const Attributes = ({
  chonkId,
  attributes,
}: {
  chonkId: string;
  attributes: Trait[];
}) => {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      {attributes.map((attribute: Trait) => (
        <Attribute
          key={attribute.id}
          chonkId={chonkId}
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
  chonkId,
  tokenId,
  traitType,
  value,
}: {
  chonkId: string;
  tokenId: number;
  traitType: number;
  value: string;
}) => {
  const { data, isLoading } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "getColorMapForTokenId",
    args: [tokenId],
    chainId,
  });

  const { data: bodyIndexData } = useReadContract({
    address: colorMapContract,
    abi: colorMapABI,
    functionName: "getBodyIndexForChonk",
    args: [chonkId],
    chainId,
  }) as { data: number };

  const colorMap = data ? data.toString().substring(2) : null;

  const [showPreview, setShowPreview] = useState(false);
  const [traitCount, setTraitCount] = useState(null);

  const transformTraitNameCache = new Map<string, string>();

  const transformTraitName = useCallback((traitName: string) => {
    if (transformTraitNameCache.has(traitName)) {
      return transformTraitNameCache.get(traitName)!;
    }

    const transformed = traitName
      .split("-")
      .map((word) =>
        word.toLowerCase() === "and"
          ? "and"
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");

    transformTraitNameCache.set(traitName, transformed);
    return transformed;
  }, []);

  // useEffect(() => {
  //   const fetchTraitCount = async () => {
  //     const { data } = await client.query({
  //       query: GET_TRAIT_COUNT,
  //       variables: { traitName: transformTraitName(value) },
  //     });

  //     if (data.traitNameCounts) {
  //       setTraitCount(data.traitNameCounts.items[0].count);
  //     }
  //   };

  //   fetchTraitCount();
  // }, [value, transformTraitName]);

  const handleMouseEnter = useCallback(() => {
    if (isLoading) return;
    setShowPreview(true);
  }, [isLoading]);

  const handleMouseLeave = useCallback(() => {
    if (isLoading) return;
    setShowPreview(false);
  }, [isLoading]);

  const PreviewRenderer = useMemo(() => {
    if (!showPreview || !colorMap) return null;

    return (
      <div
        className="absolute z-10 w-[150px] h-[150px]"
        style={{ top: "-160px", left: "50%", transform: "translateX(-50%)" }}
      >
        <div className="w-full h-full">
          <ChonkRenderer
            bytes={colorMap}
            backgroundColor="#0F6E9D"
            bodyIndex={bodyIndexData}
            opacity={0.6}
          />
        </div>
      </div>
    );
  }, [showPreview, colorMap, bodyIndexData]);

  return (
    <div
      className="border border-black p-2 sm:p-3 relative"
      key={tokenId}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
      <span className="text-sm text-gray-600">
        {traitCount ? ` (${traitCount})` : ""}
      </span>

      {PreviewRenderer}
    </div>
  );
};
