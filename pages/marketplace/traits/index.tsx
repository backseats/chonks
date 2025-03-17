import { useState, useEffect } from "react";
import Head from "next/head";
import MenuBar from "@/components/marketplace/MenuBar";
import Stats from "@/components/marketplace/Stats";
import Tabs from "@/components/marketplace/Tabs";
import Sidebar from "@/components/marketplace/Sidebar";
import Listings from "@/components/marketplace/traits/Listings";
import Actions from "@/components/marketplace/Actions";
import { TRAIT_LISTINGS } from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";
import { formatEther } from "viem";
import { useTraitsTotalSupply } from "@/hooks/useTotalSupply";
export type TraitListing = {
  id: string;
  isActive: boolean;
  price: string;
  seller: string;
  sellerTBA: string;
};

export default function TraitssMarketplace() {
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [selectedTraits, setSelectedTraits] = useState<
    Record<string, string[]>
  >({});
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [sortOrder, setSortOrder] = useState<
    "low-to-high" | "high-to-low" | ""
  >("");
  const [activeTab, setActiveTab] = useState("Traits");
  const [traitListings, setTraitListings] = useState<TraitListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    floorPrice: 0,
    onSale: 0,
    totalAmount: 0,
    owners: 0,
    bestOffer: 0,
  });

  const traitsTotalSupply = useTraitsTotalSupply();

  // Fetch trait listings when component mounts or filters change
  useEffect(() => {
    const fetchTraitListings = async () => {
      setLoading(true);

      try {
        // Now try the actual query with Apollo
        const { data } = await client.query({
          query: TRAIT_LISTINGS,
        });

        // console.log("Trait listings data:", data);

        if (data && data.traitListings && data.traitListings.items) {
          // Filter listings based on search, price, etc.
          let filteredListings = data.traitListings.items as TraitListing[];

          console.log("Filtered listings:", filteredListings);
          console.log(formatEther(BigInt(filteredListings[0].price)));

          // Filter by search term if provided
          if (searchId) {
            filteredListings = filteredListings.filter((listing: any) =>
              listing.id.toLowerCase().includes(searchId.toLowerCase())
            );
          }

          // Filter by price range if provided
          if (priceMin) {
            filteredListings = filteredListings.filter(
              (listing: any) => BigInt(listing.price) >= BigInt(priceMin)
            );
          }

          if (priceMax) {
            filteredListings = filteredListings.filter(
              (listing: any) => BigInt(listing.price) <= BigInt(priceMax)
            );
          }

          // Sort listings based on sortOrder
          if (sortOrder === "low-to-high") {
            filteredListings.sort((a: TraitListing, b: TraitListing) =>
              Number(BigInt(a.price) - BigInt(b.price))
            );
          } else if (sortOrder === "high-to-low") {
            filteredListings.sort((a: TraitListing, b: TraitListing) =>
              Number(BigInt(b.price) - BigInt(a.price))
            );
          }

          setTraitListings(filteredListings);

          // Calculate stats
          if (filteredListings.length > 0) {
            const activeListings = filteredListings.filter(
              (listing: any) => listing.isActive
            );
            const prices = activeListings.map((listing: any) =>
              parseFloat(listing.price)
            );
            const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const uniqueSellers = new Set(
              activeListings.map((listing: any) => listing.seller)
            ).size;

            setStats({
              floorPrice,
              onSale: activeListings.length,
              totalAmount: Number(traitsTotalSupply?.toString()),
              owners: uniqueSellers,
              bestOffer: 0, // This would come from a different query if needed
            });
          }
        }
      } catch (error) {
        console.error("Error testing or fetching data:", error);
        // Set default values...
      } finally {
        setLoading(false);
      }
    };

    fetchTraitListings();
  }, [searchId, priceMin, priceMax, sortOrder]);

  return (
    <>
      <Head>
        <title>Traits Marketplace | Chonks</title>
        <meta name="description" content="Traits Marketplace | Chonks" />
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

      <div className="min-h-screen w-full text-black font-source-code-pro font-weight-600 text-[3vw] sm:text-[1.5vw]">
        <MenuBar />
        <main className="w-full border-t border-gray-300 ">
          {/* overflow-x-hidden: this caused issue with sticky sidebar, need to put in a fix for the border */}

          <div className="mx-[20px] sm:mx-[3.45vw] ">
            {" "}
            {/* EDGES */}
            <Stats
              name="Traits"
              floorPrice={stats.floorPrice}
              onSale={stats.onSale}
              totalAmount={stats.totalAmount}
              owners={stats.owners}
              bestOffer={stats.bestOffer}
            />
          </div>

          <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

          <Actions
            type="trait"
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
                traitListings={traitListings}
                // loading={loading}
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
