import Link from "next/link";
import { TraitListing } from "@/pages/market/traits";
import ListingInfo from "@/components/marketplace/common/ListingInfo";
import ChonkRenderer from "@/components/ChonkRenderer";

interface ListingsProps {
  isSidebarVisible: boolean;
  traitListings: TraitListing[];
}

export default function Listings({
  isSidebarVisible,
  traitListings = [],
}: ListingsProps) {
  const handleBuyNow = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    window.location.href = `/market/traits/${id}`;
  };

  return (
    <div className={`${isSidebarVisible ? "w-3/4" : "w-full"} `}>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 px-0">
        {traitListings.map(({ id, price, traitMetadata }) => (
          <Link
            href={`/market/traits/${id}`}
            key={id}
            className="flex flex-col border border-black bg-white hover:opacity-90 transition-opacity"
          >
            <ChonkRenderer
              bytes={traitMetadata.colorMap.slice(2)}
              bodyIndex={1}
              opacity={0.6}
            />

            <ListingInfo
              chonkOrTrait="trait"
              id={Number(id)}
              price={price}
              traitName={traitMetadata.traitName}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
