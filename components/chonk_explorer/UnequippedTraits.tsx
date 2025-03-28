import { useState } from "react";
import Trait from "./Trait";
import { Address } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import { useAccount } from "wagmi";
import { TraitInfo } from "@/pages/chonks/[id]";

interface Props {
  chonkId: string;
  tbaAddress: Address;
  traits: TraitInfo[];
  isYours: boolean;
  tokenboundClient: TokenboundClient;
  isEquipPending: boolean;
  setIsEquipPending: (isPending: boolean) => void;
}

export default function UnequippedTraits(props: Props) {
  const {
    chonkId,
    tbaAddress,
    traits,
    isYours,
    tokenboundClient,
    setIsEquipPending,
    isEquipPending,
  } = props;
  const { address } = useAccount();

  return (
    <>
      {traits.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 sm:px-8 max-w-[1400px] mx-auto">
          {traits.map((trait, index) => (
            <div key={index} className="aspect-square w-full">
              <Trait
                key={index}
                chonkId={chonkId}
                traitTokenId={trait.id}
                isEquipped={false}
                isYours={isYours}
                tokenboundClient={tokenboundClient}
                tbaAddress={tbaAddress}
                address={address}
                isEquipPending={isEquipPending}
                setIsEquipPending={setIsEquipPending}
                traitInfo={trait}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="flex justify-center text-lg text-gray-500">
          No Traits to display
        </p>
      )}
    </>
  );
}
