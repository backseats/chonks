import { useEffect, useState } from "react";
import client from "@/lib/apollo-client";
import {
  GET_TRAIT_COUNTS,
  GET_TRAIT_COLORMAPS_BY_NAMES,
} from "@/lib/graphql/queries";
import { GetServerSideProps } from "next";
import { getCategoryString } from "@/types/Category";
import Link from "next/link";
import MenuBar from "@/components/MenuBar";
import { TraitMetadata } from "@/types/TraitMetadata";
import ChonkRenderer from "@/components/ChonkRenderer";

interface TraitCount {
  count: number;
  traitName: string;
  traitCategory: string;
}

interface TraitsProps {
  traitsByCategory: Record<string, TraitCount[]>;
  categories: string[];
}

export default function Traits({ traitsByCategory, categories }: TraitsProps) {
  const [traitColormaps, setTraitColormaps] = useState<
    Record<string, Record<string, string>>
  >({});

  // This function transforms trait names by replacing underscores and spaces with hyphens
  // Used for URL-friendly paths when linking to individual trait pages
  const transformTraitName = (traitName: string) => {
    return traitName.toLowerCase().replace(/[_\s]/g, "-");
  };

  useEffect(() => {
    const fetchTraitColormaps = async (
      category: string,
      traitNames: string[]
    ) => {
      if (!traitNames.length) return;

      try {
        const { data } = await client.query({
          query: GET_TRAIT_COLORMAPS_BY_NAMES,
          variables: { traitNames },
        });

        if (data?.traitMetadata?.items) {
          const categoryColormaps: Record<string, string> = {};

          data.traitMetadata.items.forEach((item: any) => {
            if (item.traitName && item.colorMap) {
              categoryColormaps[item.traitName] = item.colorMap;
            }
          });

          setTraitColormaps((prev) => ({
            ...prev,
            [category]: categoryColormaps,
          }));
        }
      } catch (error) {
        console.error(`Error fetching colormaps for ${category}:`, error);
      }
    };

    Object.keys(traitsByCategory).forEach((category) => {
      const traitNames =
        traitsByCategory[category]?.map((trait: any) => {
          return trait.traitName;
        }) || [];

      fetchTraitColormaps(category, traitNames);
    });
  }, [traitsByCategory]);

  const getImage = (category: string, traitName: string) => {
    const colorMap = traitColormaps[category]?.[traitName];
    return (
      <ChonkRenderer
        bytes={colorMap?.slice(2) ?? ""}
        bodyIndex={1}
        opacity={0.6}
      />
    );
  };

  return (
    <div className="min-h-screen w-full text-black font-source-code-pro">
      <MenuBar />

      <main className="w-full border-t border-gray-300 ">
        <h1 className="text-[22px] sm:text-[24px] font-weight-600 px-4 sm:px-[3.45vw] mt-4 mb-8">
          Traits
        </h1>

        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold mb-4 sm:px-[3.45vw]">
              {category}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-4 p-4 sm:px-[3.45vw] mt-4">
              {traitsByCategory[category].map((trait) => (
                <>
                  <Link href={`/traits/${transformTraitName(trait.traitName)}`}>
                    <div
                      key={trait.traitName}
                      className="border border-gray-300 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="aspect-square bg-gray-100 relative">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          {getImage(category, trait.traitName)}
                        </div>
                      </div>

                      <div className="p-2 flex flex-col items-center">
                        <span className="font-bold text-[14px]">
                          {trait.traitName} ({trait.count})
                        </span>
                      </div>
                    </div>
                  </Link>
                </>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const { data } = await client.query({
      query: GET_TRAIT_COUNTS,
    });

    // Define the order of categories we want to display
    const categoryOrder = [
      "Accessory",
      "Head",
      "Hair",
      "Face",
      "Top",
      "Bottom",
      "Shoes",
    ];

    // Group traits by category
    const traitsByCategory: Record<string, TraitCount[]> = {};

    data.traitNameCounts.items.forEach((trait: any) => {
      const category = getCategoryString(Number(trait.traitCategory));
      if (!traitsByCategory[category]) {
        traitsByCategory[category] = [];
      }
      // console.log("trait", trait);
      traitsByCategory[category].push({
        count: trait.count,
        traitName: trait.traitName,
        traitCategory: category,
      });
    });

    // Sort traits within each category by decreasing count
    Object.keys(traitsByCategory).forEach((category) => {
      traitsByCategory[category].sort((a, b) => a.count - b.count);
    });

    // Filter categories to only include those in our predefined order
    const availableCategories = categoryOrder.filter(
      (category) =>
        traitsByCategory[category] && traitsByCategory[category].length > 0
    );

    return {
      props: {
        traitsByCategory,
        categories: availableCategories,
      },
    };
  } catch (error) {
    console.error("Error fetching trait counts:", error);
    return {
      props: {
        traitsByCategory: {},
        categories: [],
      },
    };
  }
};
