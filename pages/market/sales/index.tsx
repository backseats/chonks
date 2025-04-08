import { useState, useEffect } from "react";
import { formatEther } from "viem";
import Head from "next/head";
import MenuBar from "@/components/MenuBar";
import Tabs from "@/components/marketplace/Tabs";
import {
  GET_RECENT_CHONK_SALES,
  GET_RECENT_TRAIT_SALES,
} from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";
import ChonkRenderer from "@/components/ChonkRenderer";
import { useReadContracts } from "wagmi";
import { colorMapContract, colorMapABI, chainId } from "@/config";
import Link from "next/link";

type TraitMetadata = {
  traitName: string;
  traitType: string;
  colorMap: string;
};

// Types for listings data
type Sale = {
  id: string;
  txType: string;
  txHash: string;
  to: string;
  time: string;
  sellerTBA: string;
  seller: string;
  from: string;
  chonkId: string;
  bidder: string;
  amount: string;
  type: "chonk" | "trait";
  traitMetadata?: TraitMetadata;
};

export default function Sales() {
  const [activeTab, setActiveTab] = useState("Sales");
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    async function fetchListings() {
      try {
        // Fetch chonk listings
        const chonkResponse = await client.query({
          query: GET_RECENT_CHONK_SALES,
        });

        // Fetch trait listings
        const traitResponse = await client.query({
          query: GET_RECENT_TRAIT_SALES,
        });

        // Extract items from both responses
        const chonkSales =
          chonkResponse.data.chonkTransactionHistories.items.map(
            (item: any): Sale => ({
              id: item.id,
              txType: item.txType,
              txHash: item.txHash,
              to: item.to,
              time: item.time,
              sellerTBA: item.sellerTBA,
              seller: item.seller,
              from: item.from,
              chonkId: item.chonkId,
              bidder: item.bidder,
              amount: item.amount,
              type: "chonk",
            })
          );

        const traitSales =
          traitResponse.data.traitTransactionHistories.items.map(
            (item: any): Sale => ({
              id: item.id,
              txType: item.txType,
              txHash: item.txHash,
              to: item.to,
              time: item.time,
              sellerTBA: item.sellerTBA,
              seller: item.seller,
              from: item.from,
              chonkId: item.chonkId,
              bidder: item.bidder,
              amount: item.amount,
              type: "trait",
              traitMetadata: item.trait,
            })
          );

        const combinedSales = [...chonkSales, ...traitSales].sort(
          (a: Sale, b: Sale) =>
            new Date(Number(b.time)).getTime() -
            new Date(Number(a.time)).getTime()
        );

        setSales(combinedSales);
      } catch (error) {
        console.error("Error fetching sales:", error);
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
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
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
        <title>Sales | Chonks</title>
        <meta name="description" content="Sales | Chonks" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
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
            Sales
          </h1>

          <div className="grid grid-cols-3 lg:grid-cols-8 gap-4 p-4 sm:px-[3.45vw] mt-4">
            {/* Example listing items - replace with actual data */}
            {sales.map((item: Sale) => (
              <Link key={item.id} href={`/market/${item.type}s/${item.id}`}>
                <div
                  key={item.id}
                  className="border border-gray-300 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="aspect-square bg-gray-100 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      {getImage(item.chonkId, item.type, item.traitMetadata)}
                    </div>
                  </div>

                  <div className="p-2 flex flex-col items-center">
                    <span className="font-bold text-[14px]">
                      {formatEther(BigInt(item.amount))} ETH
                    </span>
                    <span className="text-[12px] text-gray-500 mt-1">
                      {getTimeAgo(item.time)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
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
    <div className="w-full flex justify-center items-center bg-black">
      <ChonkRenderer bytes={bytes} bodyIndex={bodyIndex} />
    </div>
  );
};
