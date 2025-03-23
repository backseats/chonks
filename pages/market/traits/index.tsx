import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import MenuBar from "@/components/marketplace/MenuBar";
import Stats from "@/components/marketplace/Stats";
import Tabs from "@/components/marketplace/Tabs";
import Sidebar from "@/components/marketplace/Sidebar";
import Listings from "@/components/marketplace/traits/Listings";
import Actions from "@/components/marketplace/Actions";
import { TRAIT_LISTINGS } from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";
import { useTraitsTotalSupply } from "@/hooks/useTotalSupply";
export type TraitListing = {
  id: string;
  isActive: boolean;
  price: string;
  seller: string;
  sellerTBA: string;
};

export default function TraitsMarketplace() {
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
  const [activeTab, setActiveTab] = useState("Traits");
  const [rawTraitListings, setRawTraitListings] = useState<TraitListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    floorPrice: 0,
    onSale: 0,
    totalAmount: 0,
    owners: 0,
    bestOffer: 0,
  });

  const traitsTotalSupply = useTraitsTotalSupply();

  // Fetch trait listings when component mounts
  useEffect(() => {
    const fetchTraitListings = async () => {
      setLoading(true);

      try {
        // Now try the actual query with Apollo
        const { data } = await client.query({
          query: TRAIT_LISTINGS,
        });

        if (data && data.traitListings && data.traitListings.items) {
          // Store raw listings without filtering or sorting
          setRawTraitListings(data.traitListings.items as TraitListing[]);
        }
      } catch (error) {
        console.error("Error fetching trait listings:", error);
        // Set default values in case of error
        setRawTraitListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTraitListings();
  }, []); // Only fetch once on mount, no dependencies to avoid refetching

  // Apply filters and sorting without re-fetching data
  const traitListings = useMemo(() => {
    let filteredListings = [...rawTraitListings];

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
  }, [rawTraitListings, searchId, priceMin, priceMax, sortOrder]);

  // Calculate stats based on filtered listings
  useEffect(() => {
    if (traitListings.length > 0) {
      const prices = traitListings.map((listing) => Number(listing.price));
      const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const uniqueSellers = new Set(
        traitListings.map((listing) => listing.seller)
      ).size;

      setStats({
        floorPrice,
        onSale: traitListings.length,
        totalAmount: traitsTotalSupply ? Number(traitsTotalSupply) : 0,
        owners: uniqueSellers,
        bestOffer: 0, // This would come from a different query if needed
      });
    }
  }, [traitListings, traitsTotalSupply]);

  return (
    <>
      <Head>
        <title>Traits Market | Chonks</title>
        <meta name="description" content="Traits Market | Chonks" />
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
