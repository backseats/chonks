import Link from "next/link";
import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { traitsContract, traitsABI, chainId } from "@/config";
import { Trait } from "@/types/Trait";
import { TraitListing } from "@/pages/marketplace/traits";
import { FaEthereum } from "react-icons/fa6";
import { formatEther } from "viem";

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

  // Initialize traits array from traitListings
  useEffect(() => {
    if (!traitListings.length) return;

    const traitsArray = traitListings.map((listing) => ({
      id: listing.id,
      data: null,
      listing,
    }));

    setTraits(traitsArray);
  }, [traitListings]);

  // Fetch token URI data for each token
  useEffect(() => {
    const fetchTokenURIs = async () => {
      const updatedTraits = [...traits];

      for (const trait of updatedTraits) {
        if (trait.data === null) {
          try {
            const response = await fetch(`/api/traits/tokenURI/${trait.id}`);
            const data = await response.json();
            trait.data = data;
          } catch (error) {
            console.error(
              `Error fetching token URI for Trait #${trait.id}:`,
              error
            );
          }
        }
      }

      setTraits(updatedTraits);
    };

    if (traits.length > 0 && traits.some((trait) => trait.data === null)) {
      fetchTokenURIs();
    }
  }, [traits]);

  const LoadingCard = () => (
    <div className="flex flex-col border border-black bg-white p-4 h-[300px] justify-center items-center">
      <p className="text-lg">Loading...</p>
    </div>
  );

  const handleBuyNow = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    window.location.href = `/marketplace/traits/${id}`;
  };

  return (
    <div className={`${isSidebarVisible ? "w-3/4" : "w-full"} `}>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-0">
        {traits.map(({ id, data, listing }) =>
          data === null ? (
            <LoadingCard key={id} />
          ) : (
            <Link
              href={`/marketplace/traits/${id}`}
              key={id}
              className="flex flex-col border border-black bg-white hover:opacity-90 transition-opacity"
            >
              <img
                src={data.image || "/marka/marka-chonk.svg"}
                alt={`Trait #${id}`}
                className="w-full h-auto"
              />
              <div className="mt-4 space-y-2 p-4">
                <h3 className="text-[1.2vw] font-bold">Trait #{id}</h3>
                <div className="flex flex-row">
                  <span className="text-[1vw] -mt-1">
                    {listing && listing.price
                      ? `${formatEther(BigInt(listing.price))} `
                      : "Not for sale "}
                  </span>
                  <FaEthereum className="ml-1 text-[1vw]" />
                </div>
                <button
                  className="w-full text-[1vw] border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
                  onClick={(e) => handleBuyNow(e, id)}
                >
                  View Listing
                </button>
              </div>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
