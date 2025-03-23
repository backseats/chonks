import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  mainContract,
  mainABI,
  traitsContract,
  traitsABI,
  chainId
} from "@/config";
import { Chonk } from "@/types/Chonk";
import { Category } from "@/types/Category";
import {
  GET_TRAIT_IMAGE_BY_ID,
} from "@/lib/graphql/queries";
import { traitTokenURIClient } from "@/lib/apollo-client";

export const categoryList = Object.values(Category);

export async function useTraitData(traitTokenId: string) {
  const response = await traitTokenURIClient.query({
    query: GET_TRAIT_IMAGE_BY_ID,
    variables: { id: traitTokenId },
  });

  const traitTokenURIData = response.data.traitUri.tokenUri;

  const base64String = traitTokenURIData.split(",")[1];
  const jsonString = atob(base64String);
  const jsonData = JSON.parse(jsonString) as Chonk;

  return jsonData;
}

export function useGetTrait(traitTokenId: string) {
  const { data: traitData } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "getTrait",
    args: [traitTokenId],
    chainId,
  }) as { data: any };

  return traitData;
}

export function useIsRevealed(traitTokenId: string) {
  const { data: traitData } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "getTrait",
    args: [traitTokenId],
    chainId,
  }) as { data: any };

  return traitData?.isRevealed ?? false;
}

export function useTraitType(traitTokenId: string) {
  const [traitType, setTraitType] = useState<Category | null>(null);

  const { data: traitTypeData } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "getTraitMetadata",
    args: [traitTokenId],
    chainId,
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
    chainId,
  }) as { data: { traitName: string } };

  useEffect(() => {
    if (traitMetaData) {
      setTraitName(traitMetaData.traitName);
    }
  }, [traitMetaData]);

  return traitName;
}

export function useEquip(chonkId: string, traitTokenId: string) {
  const { writeContract: equip, data: equipHash } = useWriteContract();
  const { data: equipReceipt, isSuccess: isEquipSuccess } = useWaitForTransactionReceipt({
    hash: equipHash,
    chainId,
  });

  const handleEquip = () => {
    equip({
      address: mainContract,
      abi: mainABI,
      functionName: "equip",
      args: [parseInt(chonkId), parseInt(traitTokenId)],
      chainId,
    }, {
      onError: (error) => {
        console.error('Contract revert:', error);
      }
    });
  };

  return { handleEquip, equipHash,
   equipReceipt, isEquipSuccess };
}

export function useUnequip(chonkId: string, traitType: Category | null) {
  const { writeContract: unequip, data: unequipHash } = useWriteContract();

  const { data: unequipReceipt, isSuccess: isUnequipSuccess } = useWaitForTransactionReceipt({
    hash: unequipHash,
    chainId,
  });

  const handleUnequip = () => {
    if (!traitType) return;

    const categoryIndex = Object.values(Category).indexOf(traitType!);

    unequip({
      address: mainContract,
      abi: mainABI,
      functionName: "unequip",
      args: [parseInt(chonkId), categoryIndex],
      chainId,
    }, {
      onError: (error) => {
        console.error('Contract revert:', error);
      }
    });
  };

  return { handleUnequip, unequipHash, unequipReceipt, isUnequipSuccess };
}
