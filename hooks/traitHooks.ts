import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useSimulateContract } from "wagmi";
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

// used as fallback in the unused useTraitMetadata hook
export async function getTraitData(traitTokenId: string) {
  try {
      const response = await traitTokenURIClient.query({
        query: GET_TRAIT_IMAGE_BY_ID,
        variables: { id: traitTokenId },
      });

      const traitTokenURIData = response.data.traitUri.tokenUri;

      const base64String = traitTokenURIData.split(",")[1];
      const jsonString = atob(base64String);
      const jsonData = JSON.parse(jsonString) as Chonk;

      return jsonData;
  } catch (error) {
    console.error("Error fetching trait data:", error);
    // debugger
  }
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
  const { writeContract: equip, data: equipHash, error: equipError, isError: isEquipError } = useWriteContract();
  const { data: equipReceipt, isSuccess: isEquipSuccess } = useWaitForTransactionReceipt({
    hash: equipHash,
    chainId,
  });

  const { data: simulateEquipReceipt, isSuccess: isSimulateEquipSuccess, isError: isSimulateEquipError, error: simulateEquipError } = useSimulateContract({
    address: mainContract,
    abi: mainABI,
    functionName: "equip",
    args: [parseInt(chonkId), parseInt(traitTokenId)],
    chainId,
  });

  const handleEquip = () => {
    equip({
      address: mainContract,
      abi: [...mainABI,
        {
          "inputs": [
            {"internalType": "address", "name": "_chonksMain", "type": "address"},
            {"internalType": "address", "name": "_chonkTraits", "type": "address"},
            {"internalType": "address", "name": "_chonksMarket", "type": "address"}
          ],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {"inputs": [], "name": "IncorrectTBAOwner", "type": "error"},
        {"inputs": [], "name": "IncorrectTraitType", "type": "error"},
        {"inputs": [], "name": "TraitIsOffered", "type": "error"},
        {
          "inputs": [],
          "name": "chonkTraits",
          "outputs": [{"internalType": "contract ChonkTraits", "name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "chonksMain",
          "outputs": [{"internalType": "contract IChonksMain", "name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "chonksMarket",
          "outputs": [{"internalType": "contract IChonksMarket", "name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {"internalType": "uint256", "name": "_chonkTokenId", "type": "uint256"},
            {"internalType": "uint256", "name": "_traitTokenId", "type": "uint256"}
          ],
          "name": "equipValidation",
          "outputs": [{"internalType": "enum TraitCategory.Name", "name": "traitType", "type": "uint8"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {"internalType": "address", "name": "_tbaForChonk", "type": "address"},
            {"internalType": "uint256", "name": "_traitTokenId", "type": "uint256"},
            {"internalType": "enum TraitCategory.Name", "name": "_traitType", "type": "uint8"}
          ],
          "name": "performValidations",
          "outputs": [],
          "stateMutability": "view",
          "type": "function"
        }
      ],
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
   equipReceipt, isEquipSuccess, equipError, isEquipError, isSimulateEquipError, simulateEquipError, isSimulateEquipSuccess };
}

export function useUnequip(chonkId: string, traitType: number | undefined) {
  const { writeContract: unequip, data: unequipHash } = useWriteContract();

  const { data: unequipReceipt, isSuccess: isUnequipSuccess } = useWaitForTransactionReceipt({
    hash: unequipHash,
    chainId,
  });

  const handleUnequip = () => {
    if (!traitType) return;

    unequip({
      address: mainContract,
      abi: mainABI,
      functionName: "unequip",
      args: [parseInt(chonkId), traitType],
      chainId,
    }, {
      onError: (error) => {
        console.error('Contract revert:', error);
      }
    });
  };

  return { handleUnequip, unequipHash, unequipReceipt, isUnequipSuccess };
}
