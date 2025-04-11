import { useState, useEffect } from "react";
import { formatEther } from "viem";
import Head from "next/head";
import MenuBar from "@/components/MenuBar";
import Tabs from "@/components/marketplace/Tabs";
import {
  GET_ACTIVE_CHONK_LISTINGS,
  GET_ACTIVE_TRAIT_LISTINGS,
} from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";
import ChonkRenderer from "@/components/ChonkRenderer";
import { useReadContracts } from "wagmi";
import { colorMapContract, colorMapABI, chainId } from "@/config";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
type TraitMetadata = {
  traitName: string;
  traitType: string;
  colorMap: string;
};

// Types for listings data
type Listing = {
  id: string;
  isActive: boolean;
  listingTime: string;
  listingTxHash: string;
  price: string;
  seller: string;
  sellerTBA: string;
  type: "chonk" | "trait";
  traitMetadata?: TraitMetadata;
};

export default function ForSale() {
  const [activeTab, setActiveTab] = useState("For Sale");
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    async function fetchListings() {
      try {
        // Fetch chonk listings
        const chonkResponse = await client.query({
          query: GET_ACTIVE_CHONK_LISTINGS,
        });

        // Fetch trait listings
        const traitResponse = await client.query({
          query: GET_ACTIVE_TRAIT_LISTINGS,
        });

        // Extract items from both responses
        const chonkListings = chonkResponse.data.activeChonkListings.items.map(
          (item: any): Listing => ({
            id: item.id,
            isActive: item.isActive,
            listingTime: item.listingTime,
            listingTxHash: item.listingTxHash,
            price: item.price,
            seller: item.seller,
            sellerTBA: item.sellerTBA,
            type: "chonk",
          })
        );

        const traitListings = traitResponse.data.traitListings.items.map(
          (item: any): Listing => ({
            id: item.id,
            isActive: item.isActive,
            listingTime: item.listingTime,
            listingTxHash: item.listingTxHash,
            price: item.price,
            seller: item.seller,
            sellerTBA: item.sellerTBA,
            type: "trait",
            traitMetadata: item.traitMetadata,
          })
        );

        // Combine and sort by listingTime in descending order
        const combinedListings = [...chonkListings, ...traitListings].sort(
          (a: Listing, b: Listing) =>
            new Date(Number(b.listingTime)).getTime() -
            new Date(Number(a.listingTime)).getTime()
        );

        setListings(combinedListings);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    }

    fetchListings();
  }, []);

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const listingDate = new Date(Number(timestamp) * 1000);
    const diffInSeconds = Math.floor(
      (now.getTime() - listingDate.getTime()) / 1000
    );

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }
  };

  const getImage = (
    id: string,
    type: string,
    traitMetadata?: TraitMetadata
  ) => {
    if (type === "chonk") {
      return <Listing id={id} />;
    } else {
      return (
        <ChonkRenderer
          bytes={traitMetadata?.colorMap.slice(2) ?? ""}
          bodyIndex={1}
          opacity={0.6}
        />
      );
    }
  };

  return (
    <>
      <Head>
        <title>For Sale | Chonks</title>
        <meta name="description" content="For Sale | Chonks" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
        <meta
          property="og:image"
          content="https://www.chonks.xyz/chonks/chonk-naked.png"
        />
        <meta property="og:title" content="For Sale | Chonks" />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://www.chonks.xyz/market/traits`}
        />
        <meta property="og:description" content="For Sale | Chonks" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Chonksxyz" />
        <meta name="twitter:title" content="For Sale | Chonks" />
        <meta name="twitter:description" content="For Sale  Chonks" />
        <meta
          name="twitter:image"
          content="https://www.chonks.xyz/chonks/chonk-naked.png"
        />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <div className="min-h-screen w-full text-black font-source-code-pro">
        <MenuBar />
        <main className="w-full border-t border-gray-300 ">
          <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

          <h1 className="text-[22px] sm:text-[24px] font-weight-600 px-4 sm:px-[3.45vw] mt-4">
            Recently Listed
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-4 p-4 sm:px-[3.45vw] mt-4">
            {listings.map((item: Listing) => {
              // Calculate display name with truncation
              const traitName = item.traitMetadata?.traitName ?? "";
              const displayName = traitName.length > 14 ? traitName.slice(0, 14) + "..." : traitName;

              return (
                <Link key={item.id + item.type} href={`/market/item/${item.type}/${item.id}`}>
                  <div className="border overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out bg-white flex flex-col justify-between h-full">
                    <div className="aspect-square bg-gray-100 relative">
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        {getImage(item.id, item.type, item.traitMetadata)}
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col items-center">
                      <span className="font-bold text-[14px]">
                        {item.type === "chonk"
                          ? "Chonk #" + (item?.id ?? "")
                          : displayName}
                      </span>
                    </div>

                    <div className="p-2 flex flex-col items-center">
                      <span className="font-bold text-[14px]">
                        {formatEther(BigInt(item.price))} ETH
                      </span>
                      <span className="text-[12px] text-gray-500 mt-1">
                        {getTimeAgo(item.listingTime)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

const Listing = ({ id }: { id: string }) => {
  const contract = {
    address: colorMapContract,
    abi: colorMapABI,
    args: [BigInt(id)],
    chainId,
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

  if (isLoading && !results)
    return (
      <div className="flex flex-col p-4 aspect-square justify-center w-full h-full items-center bg-[#F3F4F6]" />
    );

  // @ts-ignore
  const bytes = results?.[0]?.result.slice(2) as string;
  const bodyIndex = results?.[1]?.result as number;

  return (
    <div className="w-full flex justify-center items-center bg-[#0F6E9D]">
      <ChonkRenderer bytes={bytes} bodyIndex={bodyIndex} />
    </div>
  );
};
