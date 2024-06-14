import { useReadContract, useWriteContract } from "wagmi";
import { Chonk } from "@/types/Chonk";
import { useState, useEffect } from "react";
import {
  abi,
  traitsAbi,
  mainContract,
  traitsContract,
  tokenURIABI,
} from "@/contract_data";
import { baseSepolia } from "viem/chains";
import { decodeAndSetData } from "@/pages/chonk/[id]";
import { Category } from "@/types/Category";

export const categoryList = Object.values(Category);

export default function EquippedTrait({
  chonkId,
  traitTokenId,
}: {
  chonkId: string;
  traitTokenId: string;
}) {
  const { writeContract } = useWriteContract();

  const [traitData, setTraitData] = useState<Chonk | null>(null);
  const [traitType, setTraitType] = useState<Category | null>(null);

  const { data: traitTokenURIData } = useReadContract({
    address: traitsContract,
    abi: tokenURIABI,
    functionName: "tokenURI",
    args: [traitTokenId],
    chainId: baseSepolia.id,
  }) as { data: string };

  useEffect(() => {
    if (traitTokenURIData) decodeAndSetData(traitTokenURIData, setTraitData);
  }, [traitTokenURIData]);

  const { data: traitTypeData } = useReadContract({
    address: traitsContract,
    abi: traitsAbi,
    functionName: "getTraitType",
    args: [traitTokenId],
    chainId: baseSepolia.id,
  }) as { data: string };

  useEffect(() => {
    if (traitTypeData) {
      const traitTypeString = categoryList[parseInt(traitTypeData)];
      setTraitType(traitTypeString as Category);
    }
  }, [traitTypeData]);

  const functionNameString = "unequip" + traitType;

  return traitData ? (
    <div className="relative w-[200px] h-[200px]">
      <img src={traitData.image} className="w-full h-full" />
      <button
        className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white py-2"
        onClick={() =>
          writeContract({
            address: mainContract,
            abi,
            functionName: functionNameString,
            args: [chonkId],
            chainId: baseSepolia.id,
          })
        }
      >
        {functionNameString}
      </button>
    </div>
  ) : null;
}
