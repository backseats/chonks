import client from "@/lib/apollo-client";
import { GET_TRAIT_COUNTS } from "@/lib/graphql/queries";
import { GetServerSideProps } from "next";
import { getCategoryString } from "@/types/Category";
import Link from "next/link";

interface TraitCount {
  count: number;
  traitName: string;
  traitCategory: string;
  id: string;
}

interface TraitsProps {
  traitsByCategory: Record<string, TraitCount[]>;
  categories: string[];
}

export default function Traits({ traitsByCategory, categories }: TraitsProps) {
  // This function transforms trait names by replacing underscores and spaces with hyphens
  // Used for URL-friendly paths when linking to individual trait pages
  const transformTraitName = (traitName: string) => {
    return traitName.toLowerCase().replace(/[_\s]/g, "-");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold p-8">Traits</h1>
      <div className="px-8">
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{category}</h2>
            <ul>
              {traitsByCategory[category].map((trait) => (
                <li key={trait.id} className="mb-2">
                  <Link
                    className="underline"
                    href={`/traits/${transformTraitName(trait.id)}`}
                  >
                    {trait.id}
                  </Link>{" "}
                  - Count: {trait.count}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
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
      traitsByCategory[category].push({
        ...trait,
        traitCategory: category,
      });
    });

    // Sort traits within each category by decreasing count
    Object.keys(traitsByCategory).forEach((category) => {
      traitsByCategory[category].sort((a, b) => b.count - a.count);
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
