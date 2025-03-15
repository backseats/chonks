import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useReadContract } from "wagmi";
import { mainContract, mainABI, chainId } from "@/config";
import { Chonk } from "@/types/Chonk";
import { ChonkListing } from "@/pages/marketplace/chonks/index";
import { FaEthereum } from "react-icons/fa6";
import { formatEther } from "viem";
import ChonkRenderer from "@/components/ChonkRenderer";

interface ListingsProps {
  isSidebarVisible: boolean;
  chonkListings: ChonkListing[];
}

type ChonkData = {
  bytes: string;
  bodyIndex: number;
};

export default function Listings({
  isSidebarVisible,
  chonkListings = [],
}: ListingsProps) {
  const [chonks, setChonks] = useState<
    Array<{ id: string; data: ChonkData | null; listing: ChonkListing }>
  >([]);
  const [containerWidths, setContainerWidths] = useState<
    Record<string, number>
  >({});
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Initialize chonks array from chonkListings
  useEffect(() => {
    if (!chonkListings.length) return;

    const chonksArray = chonkListings.map((listing) => ({
      id: listing.id,
      data: null,
      listing,
    }));

    setChonks(chonksArray);
  }, [chonkListings]);

  // Fetch token URI data for each token
  useEffect(() => {
    const fetchTokenURIs = async () => {
      const updatedChonks = [...chonks];

      for (const chonk of updatedChonks) {
        if (chonk.data === null) {
          try {
            const response = await fetch(`/api/chonks/tokenURI/${chonk.id}`);
            const data = (await response.json()) as {
              bytes: string;
              bodyIndex: number;
            };
            chonk.data = { bytes: data.bytes, bodyIndex: data.bodyIndex };
          } catch (error) {
            console.error(
              `Error fetching token URI for Chonk #${chonk.id}:`,
              error
            );
          }
        }
      }

      setChonks(updatedChonks);
    };

    if (chonks.length > 0 && chonks.some((chonk) => chonk.data === null)) {
      fetchTokenURIs();
    }
  }, [chonks]);

  // Measure container widths
  useEffect(() => {
    const updateWidths = () => {
      const newWidths: Record<string, number> = {};

      Object.entries(containerRefs.current).forEach(([id, ref]) => {
        if (ref) {
          newWidths[id] = ref.offsetWidth;
        }
      });

      setContainerWidths(newWidths);
    };

    updateWidths();

    // Add resize listener
    window.addEventListener("resize", updateWidths);

    return () => {
      window.removeEventListener("resize", updateWidths);
    };
  }, [chonks]);

  const LoadingCard = () => (
    <div className="flex flex-col border border-black bg-white p-4 h-[300px] justify-center items-center">
      <p className="text-lg">Loading...</p>
    </div>
  );

  const handleBuyNow = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    window.location.href = `/marketplace/chonks/${id}`;
  };

  return (
    <div className={`${isSidebarVisible ? "w-3/4" : "w-full"} `}>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-0">
        {chonks.map(({ id, data, listing }) =>
          data === null ? (
            <LoadingCard key={id} />
          ) : (
            <Link
              href={`/marketplace/chonks/${id}`}
              key={id}
              className="flex flex-col border border-black bg-white hover:opacity-90 transition-opacity overflow-hidden"
            >
              <div
                ref={(el) => {
                  if (el) {
                    containerRefs.current[id] = el;
                  }
                }}
                className="w-full flex justify-center items-center bg-[#0F6E9D]"
              >
                <div className="flex-1 aspect-square flex justify-center items-center">
                  <ChonkRenderer
                    bytes={data.bytes}
                    size={containerWidths[id] || undefined}
                    bodyIndex={data.bodyIndex}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 p-4">
                <h3 className="text-[1.2vw] font-bold">Chonk #{id}</h3>
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
