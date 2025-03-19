import { useState, useEffect } from "react";
import { Chonk } from "@/types/Chonk";
import { CurrentChonk } from "@/types/CurrentChonk";
import EquippedAttributes from "@/components/marketplace/EquippedAttributes";
import client from "@/lib/apollo-client";
import { GET_TRAITS_FOR_CHONK_ID } from "@/lib/graphql/queries";

interface TraitsSectionProps {
  chonkId: string;
  type: "chonk" | "trait";
  tokenData: Chonk | null;
  equippedTraits: CurrentChonk | null;
  isOpen: boolean;
  onToggle: () => void;
}

type Trait = {
  id: string;
  traitName: string;
  traitType: number;
};

export default function TraitsSection({
  chonkId,
  tokenData,
  equippedTraits,
  isOpen,
  onToggle,
  type,
}: TraitsSectionProps) {
  const [traits, setTraits] = useState<Trait[]>([]);

  useEffect(() => {
    if (!tokenData) return;

    const fetchTraits = async () => {
      const response = await client.query({
        query: GET_TRAITS_FOR_CHONK_ID,
        variables: { id: BigInt(chonkId).toString() },
      });

      // console.log("GraphQL traits result:", response);
      const traits = response.data.chonk.tbas.items[0].traits.items;
      setTraits(traits.map((trait: any) => trait.traitInfo as Trait));
    };

    fetchTraits();

    // console.log("GraphQL chonks result:", response);
  }, [chonkId]);

  return (
    <>
      <div className="mx-4 sm:mx-0 mt-[1.725vw] pt-[1.725vw]">
        <div
          className="flex items-center justify-between cursor-pointer mb-4 sm:mb-0"
          onClick={onToggle}
        >
          <h3 className="text-[16px] sm:text-[1.2vw] font-bold">
            Equipped Traits
          </h3>

          <svg
            className={`w-4 h-4 transform transition-transform ${
              isOpen ? "rotate-180" : ""
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

        {isOpen && (
          <EquippedAttributes
            tokenData={tokenData}
            equippedTraits={equippedTraits}
            type={type}
          />
        )}
      </div>

      {type === "chonk" && (
        <div className="mx-4 sm:mx-0 mt-4 sm:mt-[1.725vw] pt-[1.725vw]">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={onToggle}
          >
            <h3 className="text-[16px] sm:text-[1.2vw] font-bold">
              Traits in Backpack (trait count)
            </h3>
            <svg
              className={`w-4 h-4 transform transition-transform ${
                isOpen ? "rotate-180" : ""
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

          {isOpen && (
            <div className="text-lg mt-4 text-gray-600">
              No additional Traits in Backpack
            </div>
          )}
        </div>
      )}
    </>
  );
}
