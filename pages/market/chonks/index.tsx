import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import MenuBar from "@/components/MenuBar";
import Stats from "@/components/marketplace/Stats";
import Tabs from "@/components/marketplace/Tabs";
import Sidebar from "@/components/marketplace/Sidebar";
import Listings from "@/components/marketplace/chonks/Listings";
import Actions from "@/components/marketplace/Actions";
import { GET_CHONK_LISTINGS } from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";
import { useChonksTotalSupply } from "@/hooks/useTotalSupply";

export type ChonkListing = {
  id: string;
  isActive: boolean;
  listingTime: string;
  listingTxHash: string;
  price: string;
  seller: string;
  sellerTBA: string;
};

export default function ChonksMarketplace() {
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [selectedTraits, setSelectedTraits] = useState<
    Record<string, string[]>
  >({});
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [sortOrder, setSortOrder] = useState<"low-to-high" | "high-to-low">(
    "low-to-high"
  );
  const [activeTab, setActiveTab] = useState("Chonks");
  const [rawChonkListings, setRawChonkListings] = useState<ChonkListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    floorPrice: 0,
    onSale: 0,
    totalAmount: 0,
    owners: 0,
    bestOffer: 0,
  });

  const chonksTotalSupply = useChonksTotalSupply();

  // Fetch chonk listings when component mounts or filters change
  useEffect(() => {
    const fetchChonkListings = async () => {
      setLoading(true);

      try {
        // Query Apollo client for chonk listings
        const { data } = await client.query({
          query: GET_CHONK_LISTINGS,
        });

        // console.log("Chonk listings data:", data);

        if (
          data &&
          data.activeChonkListings &&
          data.activeChonkListings.items
        ) {
          // Store raw listings without filtering or sorting
          setRawChonkListings(data.activeChonkListings.items as ChonkListing[]);
        }
      } catch (error) {
        console.error("Error fetching chonk listings:", error);
        // Set default values in case of error
        setRawChonkListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChonkListings();
  }, []);

  // Apply filters and sorting without re-fetching data
  const chonkListings = useMemo(() => {
    let filteredListings = [...rawChonkListings];

    // Filter by search term if provided
    if (searchId) {
      filteredListings = filteredListings.filter((listing) =>
        listing.id.toLowerCase().includes(searchId.toLowerCase())
      );
    }

    // Filter by price range if provided
    if (priceMin) {
      filteredListings = filteredListings.filter(
        (listing) => BigInt(listing.price) >= BigInt(priceMin)
      );
    }

    if (priceMax) {
      filteredListings = filteredListings.filter(
        (listing) => BigInt(listing.price) <= BigInt(priceMax)
      );
    }

    // Sort listings based on sortOrder
    if (sortOrder === "low-to-high") {
      filteredListings.sort((a, b) =>
        Number(BigInt(a.price) - BigInt(b.price))
      );
    } else if (sortOrder === "high-to-low") {
      filteredListings.sort((a, b) =>
        Number(BigInt(b.price) - BigInt(a.price))
      );
    }

    return filteredListings;
  }, [rawChonkListings, searchId, priceMin, priceMax, sortOrder]);

  // Calculate stats based on filtered listings
  useEffect(() => {
    if (chonkListings.length > 0) {
      // Convert prices to ETH for display
      const prices = chonkListings.map((listing) => Number(listing.price));

      const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const uniqueSellers = new Set(
        chonkListings.map((listing) => listing.seller)
      ).size;

      setStats({
        floorPrice,
        onSale: chonkListings.length,
        totalAmount: chonksTotalSupply ? Number(chonksTotalSupply) : 0,
        owners: uniqueSellers,
        bestOffer: 0, // This would come from a different query if needed
      });
    }
  }, [chonkListings, chonksTotalSupply]);

  return (
    <>
      <Head>
        <title>Chonks Market | Chonks</title>
        <meta name="description" content="Chonks Market | Chonks" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
        <meta property="og:image" content="https://www.chonks.xyz/chonks/chonk-naked.png" />
        <meta property="og:title" content="Chonks Market | Chonks" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://www.chonks.xyz/market/chonks`} />
        <meta property="og:description" content="Chonks Market | Chonks"/>
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Chonksxyz" />
        <meta name="twitter:title" content="Chonks Market | Chonks"/>
        <meta name="twitter:description" content="Chonks Market | Chonks"/>
        <meta name="twitter:image" content="https://www.chonks.xyz/chonks/chonk-naked.png"
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

      <div className="sm:min-h-screen w-full text-black font-source-code-pro font-weight-600">
        <MenuBar />

        <main className="w-full border-t border-gray-300">
          {/* overflow-x-hidden: this caused issue with sticky sidebar, need to put in a fix for the border */}

          <div className="mx-[20px] sm:mx-[3.45vw] ">
            {" "}
            {/* EDGES */}
            <Stats
              name="Chonks"
              floorPrice={stats.floorPrice}
              onSale={stats.onSale}
              totalAmount={stats.totalAmount}
              owners={stats.owners}
              bestOffer={stats.bestOffer}
            />
          </div>

          <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

          <Actions
            type="chonk"
            isSidebarVisible={isSidebarVisible}
            setIsSidebarVisible={setIsSidebarVisible}
            searchId={searchId}
            setSearchId={setSearchId}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />

          <section
            className={`listingsAndFilters flex flex-col bg-white py-[1.725vw] px-[3.45vw]`}
          >
            <div className="flex relative">
              <Sidebar
                isSidebarVisible={isSidebarVisible}
                priceMin={priceMin}
                setPriceMin={setPriceMin}
                priceMax={priceMax}
                setPriceMax={setPriceMax}
              />
              <Listings
                isSidebarVisible={isSidebarVisible}
                chonkListings={chonkListings}
                // setSelectedChonk={setSelectedChonk}
                // setIsModalOpen={setIsModalOpen}
              />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
