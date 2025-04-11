import Head from "next/head";
import MenuBar from "@/components/MenuBar";
import { useState, useEffect } from "react";
import { VscListFilter, VscSearch } from "react-icons/vsc";
import Stats from "@/components/marketplace/Stats";
import Tabs from "@/components/marketplace/Tabs";
import Sidebar from "@/components/marketplace/Sidebar";
import Listings from "@/components/profile/Listings";
import Actions from "@/components/marketplace/Actions";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { useDisplayAddress } from "@/hooks/useDisplayAddress";
import Footer from "@/components/layout/Footer";
interface Props {
  possibleAddress: Address | undefined;
}

export default function Profile(props: Props) {
  const { possibleAddress } = props;

  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [selectedTraits, setSelectedTraits] = useState<
    Record<string, string[]>
  >({});
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [searchId, setSearchId] = useState("");
  const [sortOrder, setSortOrder] = useState<"low-to-high" | "high-to-low">(
    "low-to-high"
  );
  const [activeTab, setActiveTab] = useState("Chonks");
  const [mounted, setMounted] = useState(false);

  const { address } = useAccount();

  // Get the display address string using the hook
  const displayAddressString = useDisplayAddress(possibleAddress);

  useEffect(() => {
    setMounted(true);
  }, []);

  const _address = !!possibleAddress ? possibleAddress : address;

  console.log("possibleAddress", possibleAddress);
  console.log("address", address);
  console.log("_address", _address);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>
          {/* Use the display string directly in the title */}
          {displayAddressString ? `${displayAddressString}'s Chonks` : "Your Chonks"}
        </title>
        <meta name="description" content="My Chonks| Chonks" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
        <meta
          property="og:image"
          content="https://www.chonks.xyz/chonks/chonk-naked.png"
        />
        <meta
          property="og:title"
          content="My Chonks| Chonks"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://www.chonks.xyz`} />
        <meta
          property="og:description"
          content="Chonks is a PFP project, customizable with swappable traits, fully onchain on Base"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Chonksxyz" />
        <meta
          name="twitter:title"
          content="My Chonks| Chonks"
        />
        <meta
          name="twitter:description"
          content="Chonks is a PFP project, customizable with swappable traits, fully onchain on Base"
        />
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

      <div className="min-h-screen w-full text-black font-source-code-pro font-weight-600 text-[3vw] sm:text-[1.5vw]">
        <MenuBar />
        <main className="w-full border-t border-gray-300 ">
          {/* overflow-x-hidden: this caused issue with sticky sidebar, need to put in a fix for the border */}

          <div className="mx-[20px] sm:mx-[3.45vw] ">
            {" "}
            {/* EDGES */}
            {/* <Stats
                            name="Chonks"
                            floorPrice={0.68}
                            onSale={420}
                            totalAmount={10400}
                            owners={4329}
                            bestOffer={0.58}
                        /> */}
          </div>



          <section>

          </section>

          <section
            className={`listingsAndFilters flex flex-col bg-white py-[1.725vw] px-[3.45vw]`}
          >
            <div>
              <h1 className="text-2xl font-weight-600 pb-4">{displayAddressString ? `${displayAddressString}'s Chonks` : "My Chonks"}</h1>
            </div>
            <div className="flex relative">

              <Listings address={_address} />
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
