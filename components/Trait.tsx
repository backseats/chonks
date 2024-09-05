import { useState, useEffect } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { simulateContract } from "@wagmi/core";
import { decodeAndSetData } from "@/pages/chonk/[id]";
import {
  mainContract,
  abi,
  traitsContract,
  tokenURIABI,
  traitsAbi,
} from "@/contract_data";
import { baseSepolia } from "viem/chains";
import { Chonk } from "@/types/Chonk";
import { Category } from "@/types/Category";
import { config } from "@/config";

export const categoryList = Object.values(Category);

export default function Trait({
  chonkId,
  traitTokenId,
  isEquipped,
}: {
  chonkId: string;
  traitTokenId: string;
  isEquipped: boolean;
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

  const functionNameString = isEquipped
    ? "unequip" + traitType
    : "equip " + traitType;

  // TODO: fix this, fails if incorrect peter owner

  // const { request } = simulateContract(config, {
  //   address: mainContract,
  //   abi,
  //   functionName: functionNameString,
  //   args: [parseInt(chonkId), parseInt(traitTokenId)],
  //   chainId: baseSepolia.id,
  // });

  // console.log(request);

  return traitData ? (
    <div className="relative w-[200px] h-[200px]">
      <img src={traitData.image} className="w-full h-full" />
      <button
        className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white py-2"
        onClick={() => {
          writeContract({
            address: mainContract,
            abi,
            functionName: functionNameString,
            args: [parseInt(chonkId), parseInt(traitTokenId)],
            chainId: baseSepolia.id,
          });
        }}
      >
        {/* {isEquipped ? "Unequip" : "Equip"} */}
        {functionNameString}
      </button>
    </div>
  ) : null;
}
