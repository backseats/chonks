import { useState, useEffect, useCallback } from "react";
import { useReadContract, useWriteContract } from "wagmi";

import {
  mainContract,
  mainABI,
  traitsContract,
  tokenURIABI,
  traitsABI,
} from "@/contract_data";
import { baseSepolia } from "viem/chains";
import { Chonk } from "@/types/Chonk";
import { Category } from "@/types/Category";

// Temporarily here because /chonks/[id] is hidden in vercelignore
function decodeAndSetData(data: string, setData: (data: Chonk) => void) {
  // const decodedContent = decodeURIComponent(data);
  // const base64String = decodedContent.split("data:application/json,")[1];
  // // Parse as JSON and stringify with proper formatting
  // const jsonData = JSON.parse(base64String);

  // console.log(jsonData);

  const base64String = data.split(",")[1];
  const jsonString = atob(base64String);
  const jsonData = JSON.parse(jsonString) as Chonk;

  setData(jsonData);
}

export const categoryList = Object.values(Category);

export function useTraitData(traitTokenId: string) {
  const [traitData, setTraitData] = useState<Chonk | null>(null);

  const { data: traitTokenURIData } = useReadContract({
    address: traitsContract,
    abi: tokenURIABI,
    functionName: "tokenURI",
    args: [traitTokenId],
    chainId: baseSepolia.id,
  }) as { data: string };

  useEffect(() => {
    if (traitTokenURIData && !traitData) {
      decodeAndSetData(traitTokenURIData, setTraitData);
    }
  }, [traitTokenURIData, traitData]);

  return traitData;
}

export function useTraitType(traitTokenId: string) {
  const [traitType, setTraitType] = useState<Category | null>(null);

  const { data: traitTypeData } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "getTraitMetadata",
    args: [traitTokenId],
    chainId: baseSepolia.id,
  }) as { data: { traitType: string } };

  useEffect(() => {
    if (traitTypeData) {
      // @ts-ignore
      const traitTypeString = categoryList[traitTypeData.traitType];
      setTraitType(traitTypeString as Category);
    }
  }, [traitTypeData]);

  return traitType;
}

export function useTraitName(traitTokenId: string) {
  const [traitName, setTraitName] = useState<string | null>(null);

  const { data: traitMetaData } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "getTraitMetadata",
    args: [traitTokenId],
    chainId: baseSepolia.id,
  }) as { data: { traitName: string } };

  useEffect(() => {
    if (traitMetaData) {
      setTraitName(traitMetaData.traitName);
    }
  }, [traitMetaData]);

  return traitName;
}

export function useEquipFunction(chonkId: string, traitTokenId: string, traitType: Category | null, isEquipped: boolean) {
  const { writeContract } = useWriteContract();

  const equip = useCallback(() => {
    writeContract({
      address: mainContract,
      abi: mainABI,
      functionName: "equip",
      args: [parseInt(chonkId), parseInt(traitTokenId)],
      chainId: baseSepolia.id,
    });
  }, [writeContract, chonkId, traitTokenId]);

  const unequip = useCallback(() => {
    if (!traitType) {
      console.log("no trait type");
      return;
    }

    const categoryIndex = Object.values(Category).indexOf(traitType!);
    writeContract({
      address: mainContract,
      abi: mainABI,
      functionName: "unequip",
      args: [parseInt(chonkId), categoryIndex],
      chainId: baseSepolia.id,
    });
  }, [writeContract, chonkId, traitType]);

  return { equip, unequip };
}
