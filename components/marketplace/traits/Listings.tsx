import Link from "next/link";
import { TraitListing } from "@/pages/market/traits";
import ListingInfo from "@/components/marketplace/common/ListingInfo";
import { useReadContract } from "wagmi";
import { traitsContract, traitsABI } from "@/config";

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
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-0">
        {traitListings.map(({ id, price }) => (
          <Link
            href={`/market/traits/${id}`}
            key={id}
            className="flex flex-col border border-black bg-white hover:opacity-90 transition-opacity"
          >
            <TraitImage id={id} />

            <ListingInfo chonkOrTrait="trait" id={Number(id)} price={price} />
          </Link>
        ))}
      </div>
    </div>
  );
}

// TODO: Grab this from the indexer
const TraitImage = ({ id }: { id: string }) => {
  const { data: tokenURI, isLoading } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "tokenURI",
    args: [BigInt(id)],
  });

  if (isLoading)
    return (
      <div className="flex flex-col bg-white p-4 aspect-square justify-center items-center">
        <p className="text-lg">Loading...</p>
      </div>
    );

  const tokenURIString = tokenURI as string;
  const base64String = tokenURIString.split(",")[1];
  const jsonString = atob(base64String);
  const jsonData = JSON.parse(jsonString);

  return (
    <img
      src={jsonData.image || ""}
      alt={`Trait #${id}`}
      className="w-full h-auto"
    />
  );
};
