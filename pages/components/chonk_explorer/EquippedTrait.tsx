import { useReadContract, useWriteContract } from "wagmi";
import { Chonk } from "@/types/Chonk";
import { useState, useEffect } from "react";
import {
  mainABI,
  traitsABI,
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
  category,
}: {
  chonkId: string;
  traitTokenId: string;
  category: Category;
}) {
  const { writeContract } = useWriteContract();

  const [traitData, setTraitData] = useState<Chonk | null>(null);
  const [traitType, setTraitType] = useState<Category | null>(null);
  const [traitName, setTraitName] = useState<string | null>(null);

  const { data: traitTokenURIData } = useReadContract({
    address: traitsContract,
    abi: tokenURIABI,
    functionName: "tokenURI",
    args: [traitTokenId],
    chainId: baseSepolia.id,
  }) as { data: string };

  useEffect(() => {
    if (traitTokenURIData) {
      decodeAndSetData(traitTokenURIData, setTraitData);
    } else {
      console.log("no trait data for", traitTokenId);
    }
  }, [traitTokenURIData]);

  const { data: traitTypeData } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "getTraitType",
    args: [traitTokenId],
    chainId: baseSepolia.id,
  }) as { data: string };

  const { data: traitMetaData } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "getTraitMetadata",
    args: [traitTokenId],
    chainId: baseSepolia.id,
  }) as { data: { traitName: string } };

  useEffect(() => {
    if (traitTypeData) {
      const traitTypeString = categoryList[parseInt(traitTypeData)];
      setTraitType(traitTypeString as Category);
    }
  }, [traitTypeData]);

  useEffect(() => {
    if (traitMetaData) {
      setTraitName(traitMetaData.traitName);
    }
  }, [traitMetaData]);

  const functionNameString = "unequip" + traitType;

  // This doesn't seem to be working
  const unequip = () => {
    writeContract({
      address: mainContract,
      abi: mainABI,
      functionName: functionNameString,
      args: [traitTokenId],
      chainId: baseSepolia.id,
    });
  };

  return traitData ? (
    <div className="relative w-[200px] h-[200px]">
      <img src={traitData.image} className="w-full h-full" />
      <button
        className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white py-2"
        onClick={unequip}
      >
        Unequip {traitName}
      </button>
    </div>
  ) : null;
}
