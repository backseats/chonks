import { useReadContract } from "wagmi";
import { traitsContract, traitsABI } from "@/contract_data";
import { Address } from "viem";
import { useState, useEffect } from "react";

export function useTraitRevealStatus(traitId: bigint) {
    const [isRevealed, setIsRevealed] = useState<boolean | null>(null);
    const [epoch, setEpoch] = useState<bigint | null>(null);

    // Define the expected structure of the trait data
    type TraitData = {
      epoch: bigint;
      isRevealed: boolean;
      seed: bigint;
      dataMinterContract: string;
      traitIndex: bigint;
      traitType: number;
    };

    const { data: traitData } = useReadContract({
      address: traitsContract,
      abi: traitsABI,
      functionName: 'getTrait',
      args: [traitId],
    }) as { data: TraitData };

    useEffect(() => {
      if (traitData) {
        setEpoch(traitData.epoch);
        // setIsRevealed(traitData.isRevealed);
        setIsRevealed(false);

        console.log('Trait Data:', {
          epoch: traitData.epoch,
          isRevealed: traitData.isRevealed,
          seed: traitData.seed,
          dataMinterContract: traitData.dataMinterContract,
          traitIndex: traitData.traitIndex,
          traitType: traitData.traitType
        });
      }
    }, [traitData]);

    return {
      isRevealed,
      epoch,
    };
  }
