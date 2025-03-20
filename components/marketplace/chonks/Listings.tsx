import Link from "next/link";
import { useState, useRef, useLayoutEffect } from "react";
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
  const [containerWidths, setContainerWidths] = useState<
    Record<string, number>
  >({});
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const updateWidths = () => {
    const newWidths: Record<string, number> = {};

    Object.entries(containerRefs.current).forEach(([id, ref]) => {
      if (ref) {
        newWidths[id] = ref.offsetWidth;
      }
    });

    setContainerWidths(newWidths);
  };

  // Use useLayoutEffect to measure container widths after DOM updates but before browser paint
  useLayoutEffect(() => updateWidths(), []);

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
            <Listing
              id={listing.id}
              size={containerWidths[listing.id] || undefined}
              setContainerRef={(el) => {
                if (el) containerRefs.current[listing.id] = el;
                // Update widths when ref is set
                if (el) requestAnimationFrame(updateWidths);
              }}
            />

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

const Listing = ({
  id,
  size,
  setContainerRef,
}: {
  id: string;
  size: number | undefined;
  setContainerRef: (el: HTMLDivElement | null) => void;
}) => {
  const contract = {
    address: colorMapContract,
    abi: colorMapABI,
    args: [BigInt(id)],
  } as const;

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

  // @ts-ignore
  const bytes = results?.[0]?.result.slice(2) as string;
  const bodyIndex = results?.[1]?.result as number;

  if (isLoading)
    return (
      <div className="flex flex-col bg-white p-4 aspect-square justify-center items-center">
        <p className="text-lg">Loading...</p>
      </div>
    );

  return (
    <div
      ref={setContainerRef}
      className="w-full flex justify-center items-center bg-[#0F6E9D]"
    >
      <ChonkRenderer bytes={bytes} size={size} bodyIndex={bodyIndex} />
    </div>
  );
};
