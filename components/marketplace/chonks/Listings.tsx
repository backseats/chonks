import Link from "next/link";
import { ChonkListing } from "@/pages/market/chonks/index";
import ListingInfo from "@/components/marketplace/common/ListingInfo";
import { useReadContract, useReadContracts } from "wagmi";
import { colorMapContract, colorMapABI, chainId } from "@/config";

interface ListingsProps {
  isSidebarVisible: boolean;
  chonkListings: ChonkListing[];
}

export default function Listings({
  isSidebarVisible,
  chonkListings = [],
}: ListingsProps) {
  const handleBuyNow = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    window.location.href = `/market/chonks/${id}`;
  };

  return (
    <div className={`${isSidebarVisible ? "w-3/4" : "w-full"} `}>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-0">
        {chonkListings.map((listing) => (
          <Link
            href={`/market/chonks/${listing.id}`}
            key={listing.id}
            className="flex flex-col border border-black bg-white hover:opacity-90 transition-opacity overflow-hidden"
          >
            <Listing id={listing.id} />

            <ListingInfo
              chonkOrTrait="chonk"
              id={Number(listing.id)}
              price={listing.price}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

const Listing = ({ id }: { id: string }) => {
  const contract = {
    address: colorMapContract,
    abi: colorMapABI,
    functionName: "getColorMapForChonk",
    args: [BigInt(id)],
    chainId,
  };

  const { data: results, isLoading } = useReadContracts({
    contracts: [
      {
        ...contract,
        functionName: "getColorMapForChonk",
      },
      {
        ...contract,
        functionName: "getBodyIndexForChonk",
      },
    ],
  });

  if (isLoading && !results)
    return (
      <div className="flex flex-col bg-white p-4 aspect-square justify-center items-center">
        <p className="text-lg">Loading...</p>
      </div>
    );

  // @ts-ignore
  const bytes = results?.[0]?.result.slice(2) as string;
  const bodyIndex = results?.[1]?.result as number;

  return (
    <img src={jsonData.image} alt={`Chonk #${id}`} className="w-full h-auto" />
  );
};
