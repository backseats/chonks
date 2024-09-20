import { useState, useEffect, useMemo } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { decodeAndSetData } from "@/pages/chonk/[id]";
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
    if (traitTokenURIData) decodeAndSetData(traitTokenURIData, setTraitData);
  }, [traitTokenURIData]);

  return traitData;
}

export function useTraitType(traitTokenId: string) {
  const [traitType, setTraitType] = useState<Category | null>(null);

  const { data: traitTypeData } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
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

  const functionNameString = useMemo(() => {
    if (isEquipped) {
      return "unequip" + traitType;
    } else {
      return "equip" + traitType;
    }
  }, [traitType, isEquipped]);

  const equip = useMemo(() => {
    return () => {
      writeContract({
        address: mainContract,
        abi: mainABI,
        functionName: functionNameString,
        args: [parseInt(chonkId), parseInt(traitTokenId)],
        chainId: baseSepolia.id,
      });
    };
  }, [writeContract, functionNameString, chonkId, traitTokenId]);

  const unequip = useMemo(() => {
    return () => {
      writeContract({
        address: mainContract,
        abi: mainABI,
        functionName: functionNameString,
        args: [parseInt(chonkId)],
        chainId: baseSepolia.id,
      });
    };
  }, [writeContract, functionNameString, chonkId]);

  return { equip, unequip };
}
