import Link from "next/link";
import { ChonkListing } from "@/pages/market/chonks/index";
import ListingInfo from "@/components/marketplace/common/ListingInfo";
import { useReadContract } from "wagmi";
import { mainContract, mainABI } from "@/config";

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
  const { data: tokenURI, isLoading } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: "renderAsDataUri2D",
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
    <img src={jsonData.image} alt={`Chonk #${id}`} className="w-full h-auto" />
  );
};
