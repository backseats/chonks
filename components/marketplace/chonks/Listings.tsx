import Link from "next/link";
import { ChonkListing } from "@/pages/market/chonks/index";
import ChonkRenderer from "@/components/ChonkRenderer";
import ListingInfo from "@/components/marketplace/common/ListingInfo";
import { useReadContracts } from "wagmi";
import { colorMapContract, colorMapABI } from "@/config";

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
    args: [BigInt(id)],
  } as const;

  const {
    data: results,
    isLoading,
    isError,
  } = useReadContracts({
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

  // Add proper error handling and null checks
  const colorMapResult = results?.[0]?.result;
  const bodyIndexResult = results?.[1]?.result;

  // Only proceed if we have valid results
  const bytes = colorMapResult
    ? ((colorMapResult as any).slice(2) as string)
    : null;
  const bodyIndex = bodyIndexResult as number | undefined;

  if (isLoading || isError || !bytes || bodyIndex === undefined) {
    return (
      <div className="flex flex-col bg-white p-4 aspect-square justify-center items-center">
        <p className="text-lg">
          {isLoading ? "Loading..." : "Error loading Chonk"}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center bg-[#0F6E9D]">
      <ChonkRenderer bytes={bytes} bodyIndex={bodyIndex} />
    </div>
  );
};
