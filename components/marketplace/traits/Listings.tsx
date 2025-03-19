import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Trait } from "@/types/Trait";
import { TraitListing } from "@/pages/market/traits";
import { FaEthereum } from "react-icons/fa6";
import { formatEther } from "viem";
import ListingInfo from "@/components/marketplace/common/ListingInfo";

interface ListingsProps {
  isSidebarVisible: boolean;
  traitListings: TraitListing[];
}

export default function Listings({
  isSidebarVisible,
  traitListings = [],
}: ListingsProps) {
  const [traits, setTraits] = useState<
    Array<{ id: string; data: Trait | null; listing: TraitListing }>
  >([]);
  const [fetchedIds, setFetchedIds] = useState<Set<string>>(new Set());

  // Initialize traits array from traitListings, preserving already fetched data
  useEffect(() => {
    if (!traitListings.length) return;

    // Create a map of existing trait data for quick lookup
    const existingTraitsMap = new Map(
      traits.map((trait) => [trait.id, trait.data])
    );

    // Create updated traits array, preserving data for existing IDs
    const traitsArray = traitListings.map((listing) => ({
      id: listing.id,
      data: existingTraitsMap.get(listing.id) || null,
      listing,
    }));

    setTraits(traitsArray);
  }, [traitListings]);

  // Fetch token URI data only for tokens that haven't been fetched yet
  useEffect(() => {
    const fetchTokenURIs = async () => {
      const updatedTraits = [...traits];
      let hasUpdates = false;

      for (const trait of updatedTraits) {
        if (trait.data === null && !fetchedIds.has(trait.id)) {
          try {
            const response = await fetch(`/api/traits/tokenURI/${trait.id}`);
            const data = await response.json();
            trait.data = data;
            setFetchedIds((prev) => new Set([...prev, trait.id]));
            hasUpdates = true;
          } catch (error) {
            console.error(
              `Error fetching token URI for Trait #${trait.id}:`,
              error
            );
          }
        }
      }

      if (hasUpdates) {
        setTraits(updatedTraits);
      }
    };

    if (traits.length > 0 && traits.some((trait) => trait.data === null)) {
      fetchTokenURIs();
    }
  }, [traits, fetchedIds]);

  const LoadingCard = () => (
    <div className="flex flex-col border border-black bg-white p-4 h-[300px] justify-center items-center">
      <p className="text-lg">Loading...</p>
    </div>
  );

  const handleBuyNow = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    window.location.href = `/market/traits/${id}`;
  };

  return (
    <div className={`${isSidebarVisible ? "w-3/4" : "w-full"} `}>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-0">
        {traits.map(({ id, data, listing }) =>
          data === null ? (
            <LoadingCard key={id} />
          ) : (
            <Link
              href={`/market/traits/${id}`}
              key={id}
              className="flex flex-col border border-black bg-white hover:opacity-90 transition-opacity"
            >
              <img
                src={data.image || "/marka/marka-chonk.svg"}
                alt={`Trait #${id}`}
                className="w-full h-auto"
              />

              <ListingInfo
                chonkOrTrait="trait"
                id={Number(id)}
                price={listing.price}
              />
            </Link>
          )
        )}
      </div>
    </div>
  );
}
