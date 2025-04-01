import { useState, useEffect, useMemo } from "react";
import { Chonk } from "@/types/Chonk";
import { CurrentChonk } from "@/types/CurrentChonk";
import EquippedAttributes from "@/components/marketplace/EquippedAttributes";
import client from "@/lib/apollo-client";
import { GET_TRAITS_FOR_CHONK_ID } from "@/lib/graphql/queries";
import Attributes from "@/components/marketplace/Attributes";

interface TraitsSectionProps {
  chonkId: string;
  type: "chonk" | "trait";
  tokenData: Chonk | null;
  equippedTraits: CurrentChonk | null;
  isEquippedTraitsOpen: boolean;
  onToggleEquippedTraits: () => void;
  isTraitsOpen: boolean;
  onToggleTraits: () => void;
}

type Trait = {
  id: string;
  traitName: string;
  traitType: number; // Category id
};

export default function TraitsSection({
  chonkId,
  tokenData,
  equippedTraits,
  isEquippedTraitsOpen,
  onToggleEquippedTraits,
  isTraitsOpen,
  onToggleTraits,
  type,
}: TraitsSectionProps) {
  const [traits, setTraits] = useState<Trait[]>([]);

  const equippedTraitIds = useMemo(
    () =>
      equippedTraits
        ? Object.entries(equippedTraits)
            .filter(
              ([key, value]) =>
                typeof value === "object" &&
                value !== null &&
                "tokenId" in value &&
                "isEquipped" in value &&
                value.isEquipped &&
                value.tokenId !== 0
            )
            .map(([_, value]) => (value as { tokenId: number }).tokenId)
        : [],
    [equippedTraits]
  );

  console.log("equippedTraitIds", equippedTraitIds);

  useEffect(() => {
    if (!tokenData) return;

    const fetchTraits = async () => {
      const response = await client.query({
        query: GET_TRAITS_FOR_CHONK_ID,
        variables: { id: BigInt(chonkId).toString() },
      });

      console.log("GraphQL traits result:", response);
      const traits = response.data.chonk.tbas.items[0].traits?.items;

      if (traits) {
        // Filter out traits that are already equipped
        const unequippedTraits = traits
          .map((trait: any) => trait.traitInfo as Trait)
          .filter((trait: Trait) => {
            const traitId = parseInt(trait.id);
            return !equippedTraitIds.includes(traitId);
          });

        setTraits(unequippedTraits);
      } else {
        console.log(
          `There was an issue fetching the traits for ${chonkId}`,
          response.data.chonk.tbas.items[0].traits
        );
      }
    };

    fetchTraits();
  }, [chonkId, equippedTraitIds]);

  return (
    <>
      <div className="mx-4 sm:mx-0 mt-[1.725vw] pt-[1.725vw]">
        <div
          className="flex items-center justify-between cursor-pointer mb-4 sm:mb-0"
          onClick={onToggleEquippedTraits}
        >
          <h3 className="text-[16px] font-bold">Equipped Traits</h3>

          <svg
            className={`w-4 h-4 transform transition-transform ${
              isEquippedTraitsOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {isEquippedTraitsOpen && (
          <EquippedAttributes
            tokenData={tokenData}
            equippedTraits={equippedTraits}
          />
        )}
      </div>

      {type === "chonk" && (
        <div className="mx-4 sm:mx-0 mt-4 sm:mt-[1.725vw] pt-[1.725vw]">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={onToggleTraits}
          >
            <h3 className="text-[16px] font-bold">
              Traits in Backpack ({traits.length})
            </h3>
            <svg
              className={`w-4 h-4 transform transition-transform ${
                isTraitsOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {isTraitsOpen &&
            (traits.length === 0 ? (
              <div className="text-lg mt-4 text-gray-600">
                No Traits to display
              </div>
            ) : (
              <Attributes chonkId={chonkId} attributes={traits} />
            ))}
        </div>
      )}
    </>
  );
}
