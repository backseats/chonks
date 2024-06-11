import { useReadContract, useWriteContract } from "wagmi";
import { Chonk } from "@/types/Chonk";
import { useState, useEffect } from "react";
import {
  abi,
  mainContract,
  traitsContract,
  tokenURIABI,
} from "@/contract_data";
import { baseSepolia } from "viem/chains";
import { decodeAndSetData } from "@/pages/chonk/[id]";

export default function EquippedTrait({ tokenId }: { tokenId: string }) {
  const { writeContract } = useWriteContract();

  const [traitData, setTraitData] = useState<Chonk | null>(null);

  const { data: traitTokenURIData } = useReadContract({
    address: traitsContract,
    abi: tokenURIABI,
    functionName: "tokenURI",
    args: [tokenId],
    chainId: baseSepolia.id,
  }) as { data: string };

  useEffect(() => {
    if (traitTokenURIData) decodeAndSetData(traitTokenURIData, setTraitData);
  }, [traitTokenURIData]);

  return traitData ? (
    <div className="relative w-[200px] h-[200px]">
      <img src={traitData.image} className="w-full h-full" />
      <button
        className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white py-2"
        onClick={() =>
          writeContract({
            address: mainContract,
            abi,
            functionName: "unequipShirt", // Number(index) === 0 ? "unequipShirt" : "unequipPants",
            args: [tokenId],
            chainId: baseSepolia.id,
          })
        }
      >
        Unequip
      </button>
    </div>
  ) : null;
}
