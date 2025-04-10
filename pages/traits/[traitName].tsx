import { GET_TRAIT_LISTINGS_BY_NAME } from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";
import { GetServerSideProps } from "next";
import Link from "next/link";
import Listings from "@/components/marketplace/traits/Listings";
import { TraitListing } from "@/pages/market/traits";

interface TraitNameProps {
  traitListings: TraitListing[];
  traitName: string;
}

// this will be a list of all the traits for a given trait name
export default function TraitName({
  traitListings,
  traitName,
}: TraitNameProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold p-8">{traitName}</h1>
      <Link href="/traits" className="underline text-xl px-8">
        ← Traits
      </Link>

      {traitListings.length > 0 ? (
        <>
          <p className="px-8">
            Found {traitListings.length} listings for {traitName}
          </p>

          <Listings isSidebarVisible={false} traitListings={traitListings} />
        </>
      ) : (
        <p className="text-center px-8 py-4">
          No listings found for {traitName}
        </p>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { traitName } = context.params as { traitName: string };

  // Format the trait name for display by:
  // 1. Splitting by hyphens
  // 2. Capitalizing the first letter of each word
  // 3. Joining with spaces
  const formattedTraitName = traitName
    .split("-")
    .map((word) =>
      word.toLowerCase() === "and"
        ? "and"
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");

  try {
    const { data } = await client.query({
      query: GET_TRAIT_LISTINGS_BY_NAME,
      variables: { traitName: formattedTraitName },
    });

    return {
      props: {
        traitListings: data.traitListings.items || [],
        traitName: formattedTraitName,
      },
    };
  } catch (error) {
    console.error("Error fetching trait listings:", error);
    return {
      props: {
        listings: [],
        traitName: formattedTraitName,
      },
    };
  }
};
