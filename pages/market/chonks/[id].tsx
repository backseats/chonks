import Head from "next/head";
import MenuBar from "@/components/MenuBar";
4;
import { useState, useEffect, useMemo } from "react";
import { useReadContract, useWalletClient, useAccount } from "wagmi";
import { TokenboundClient } from "@tokenbound/sdk";
import { Chonk } from "@/types/Chonk";
import {
  mainABI,
  mainContract,
  traitsContract,
  traitsABI,
  chainId,
} from "@/config";
import { StoredChonk } from "@/types/StoredChonk";
import { Category } from "@/types/Category";
import OwnershipSection from "@/components/marketplace/chonks/OwnershipSection";
import TraitsSection from "@/components/marketplace/TraitsSection";
// import ActivityAndOffersSection from '@/components/marketplace/ActivityAndOffersSection'; // OLD simplehash usePublicClient endpoints
import ActivitySection from '@/components/marketplace/chonks/ActivitySection';
import PriceAndActionsSection from "@/components/marketplace/chonks/PriceAndActionsSection";
import { CurrentChonk } from "@/types/CurrentChonk";
import { decodeAndSetData } from "@/lib/decodeAndSetData";
import Loading from "@/components/marketplace/Loading";
import Link from "next/link";
import { IoArrowBackOutline } from "react-icons/io5";


// type ChonkOffer = {
//     priceInWei: bigint;
//     seller: string;
//     sellerTBA: string;
//     onlySellTo: string;
//     encodedTraitIds: string;
// }

export default function ChonkDetail({ id }: { id: string }) {
  const { address } = useAccount();

  const { data: walletClient } = useWalletClient();
  const tokenboundClient = new TokenboundClient({
    walletClient,
    chainId,
  });

  const [tokenData, setTokenData] = useState<Chonk | null>(null);
  const [filteredTraitTokenIds, setFilteredTraitTokenIds] = useState<BigInt[]>(
    []
  );
  const [currentChonk, setCurrentChonk] = useState<CurrentChonk | null>(null);

  const [isEquippedTraitsOpen, setIsEquippedTraitsOpen] = useState(true);
  const [isTraitsOpen, setIsTraitsOpen] = useState(true);

  // Get main body tokenURI
  const { data: tokenURIData } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: "tokenURI",
    args: [BigInt(id)],
    chainId,
  }) as { data: string };

  const { data: owner, refetch: refetchOwner } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: "ownerOf",
    args: [BigInt(id)],
    chainId,
  }) as { data: string; refetch: () => void };

  useEffect(() => {
    if (tokenURIData) {
      decodeAndSetData(tokenURIData, setTokenData);
    }
  }, [tokenURIData]);

  // Get the trait ids that are equipped to the body
  const { data: storedChonk } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: "getChonk",
    args: [BigInt(id)],
    chainId,
  }) as { data: StoredChonk };

  useEffect(() => {
    if (!storedChonk) return;

    console.log("storedChonk", storedChonk);

    setCurrentChonk({
      tokenId: parseInt(id),
      head: {
        tokenId:
          storedChonk.headId === 0n
            ? 0
            : parseInt(storedChonk.headId.toString()),
        category: Category.Head,
        isEquipped: storedChonk.headId !== 0n,
      },
      hair: {
        tokenId:
          storedChonk.hairId === 0n
            ? 0
            : parseInt(storedChonk.hairId.toString()),
        category: Category.Top,
        isEquipped: storedChonk.hairId !== 0n,
      },
      face: {
        tokenId:
          storedChonk.faceId === 0n
            ? 0
            : parseInt(storedChonk.faceId.toString()),
        category: Category.Face,
        isEquipped: storedChonk.faceId !== 0n,
      },
      accessory: {
        tokenId:
          storedChonk.accessoryId === 0n
            ? 0
            : parseInt(storedChonk.accessoryId.toString()),
        category: Category.Accessory,
        isEquipped: storedChonk.accessoryId !== 0n,
      },
      top: {
        tokenId:
          storedChonk.topId === 0n ? 0 : parseInt(storedChonk.topId.toString()),
        category: Category.Top,
        isEquipped: storedChonk.topId !== 0n,
      },
      bottom: {
        tokenId:
          storedChonk.bottomId === 0n
            ? 0
            : parseInt(storedChonk.bottomId.toString()),
        category: Category.Bottom,
        isEquipped: storedChonk.bottomId !== 0n,
      },
      shoes: {
        tokenId:
          storedChonk.shoesId === 0n
            ? 0
            : parseInt(storedChonk.shoesId.toString()),
        category: Category.Shoes,
        isEquipped: storedChonk.shoesId !== 0n,
      },
      bodyIndex: parseInt(storedChonk.bodyIndex.toString()),
      backgroundColor: storedChonk.backgroundColor,
      render3D: storedChonk.render3D,
    });
  }, [storedChonk]);

  useEffect(() => {
    console.log("currentChonk", currentChonk);
  }, [currentChonk]);

  const account = tokenboundClient.getAccount({
    tokenContract: mainContract,
    tokenId: id.toString(),
    chainId,
  });

  // Get all the traits that the TBA owns, equipped or not (ex  [1n, 2n, 3n, 4n, 5n])
  const { data: allTraitTokenIds } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "walletOfOwner",
    args: [account],
    chainId,
  }) as { data: BigInt[] };

  console.log("allTraitTokenIds", allTraitTokenIds); // this is good, works

  // This gets the ids that are equipped to the chonk
  useEffect(() => {
    if (!storedChonk) return;

    console.log("storedChonk", storedChonk);
    if (!allTraitTokenIds) return;

    const hatIdIndex =
      // @ts-ignore
      storedChonk.headId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (tokenId) => tokenId === storedChonk.headId
          );

    const hairIdIndex =
      // @ts-ignore
      storedChonk.hairId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (tokenId) => tokenId === storedChonk.hairId
          );

    const glassesIdIndex =
      // @ts-ignore
      storedChonk.accessoryId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (tokenId) => tokenId === storedChonk.accessoryId
          );

    const handheldIdIndex =
      // @ts-ignore
      storedChonk.accessoryId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (tokenId) => tokenId === storedChonk.accessoryId
          );

    const shirtIdIndex =
      // @ts-ignore
      storedChonk.topId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (tokenId) => tokenId === storedChonk.topId
          );

    const pantsIdIndex =
      // @ts-ignore
      storedChonk.bottomId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (tokenId) => tokenId === storedChonk.bottomId
          );

    const shoesIdIndex =
      // @ts-ignore
      storedChonk.shoesId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (tokenId) => tokenId === storedChonk.shoesId
          );

    const filteredTraitTokenIds = allTraitTokenIds.filter((tokenId, index) => {
      return (
        index !== hatIdIndex &&
        index !== hairIdIndex &&
        index !== glassesIdIndex &&
        index !== handheldIdIndex &&
        index !== shirtIdIndex &&
        index !== pantsIdIndex &&
        index !== shoesIdIndex
      );
    });

    // [] means everything is equipped
    console.log("filteredTraitTokenIds", filteredTraitTokenIds);

    setFilteredTraitTokenIds(filteredTraitTokenIds);
  }, [allTraitTokenIds, storedChonk]);

  const isOwner = useMemo(() => {
    if (!owner || !address) return false;
    return owner.toLowerCase() === address.toLowerCase();
  }, [owner, address]);

  // const [isListingSuccess, setIsListingSuccess] = useState(false);

  return (
    <>
      <Head>
        <title>Chonk #{id} - Market - Chonks</title>

        <meta
          name="description"
          content="View Chonk #${id} on the Chonks Market"
        />
        <meta property="og:title" content={`Chonk #${id} - Market - Chonks`} />
        <meta
          property="og:description"
          content={`View Chonk #${id} on the Chonks Market`}
        />

        <meta
          property="og:image"
          content={`${
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000"
              : "https://www.chonks.xyz"
          }/api/og?id=${id}`}
        />
        <meta property="og:title" content={`Chonk #${id} - Market - Chonks`} />
        <meta
          property="og:description"
          content={`View Chonk #${id} on the Chonks Market`}
        />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />

        <meta
          property="og:url"
          content={`https://chonks.xyz/market/chonks/${id}`}
        />
        <meta property="og:type" content="website" />

        <meta name="twitter:title" content="Chonks.xyz" />
        <meta
          name="twitter:description"
          content="Chonks is a PFP project, customizable with swappable traits, fully onchain on Base"
        />
        <meta
          name="twitter:image"
          content={`${
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000"
              : "https://www.chonks.xyz"
          }/api/og?id=${id}`}
        />
        <meta property="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Chonksxyz" />


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

        <main className="w-full border-t border-gray-300">
          {tokenData ? (
            <>

              <div className="hidden sm:block sm:pt-[0.69vw] sm:px-[3.45vw] ">
                <Link href="/market/chonks" className="text-sm hover:underline inline-flex items-center">
                  <IoArrowBackOutline className="mr-2" /> View All Listed Chonks
                </Link>
              </div>

              <div className="hidden sm:flex sm:flex-row sm:gap-[3.45vw] sm:py-[1.725vw] sm:px-[3.45vw]">
                <div className="w-2/5 h-fit">
                  <img
                    src={tokenData.image}
                    alt={`Chonk ${id}`}
                    className="w-full h-auto"
                  />

                  <TraitsSection
                    chonkId={id}
                    tokenData={tokenData}
                    equippedTraits={currentChonk}
                    isEquippedTraitsOpen={isEquippedTraitsOpen}
                    onToggleEquippedTraits={() =>
                      setIsEquippedTraitsOpen(!isEquippedTraitsOpen)
                    }
                    isTraitsOpen={isTraitsOpen}
                    onToggleTraits={() => setIsTraitsOpen(!isTraitsOpen)}
                    type="chonk"
                  />
                </div>

                <div className="w-3/5">
                  <OwnershipSection
                    id={id}
                    tokenData={tokenData}
                    owner={owner}
                    address={address}
                  />

                  <PriceAndActionsSection
                    chonkId={parseInt(id)}
                    isOwner={isOwner}
                    refetchOwner={refetchOwner}
                    // price={formattedPrice}
                    // priceUSD={formattedPrice ? formattedPrice * 3500 : 0}
                    // isOfferSpecific={isOfferSpecific}
                    // canAcceptOffer={canAcceptOffer}

                    // hasActiveOffer={hasActiveOffer}
                    // hasActiveBid={hasActiveBid}
                    // chonkBid={chonkBid}
                    // onListingSuccess={() => {
                    //     setIsListingSuccess(true);
                    // }}
                  />

                  {/* <ActivityAndOffersSection
                          // isActivityOpen={isActivityOpen}
                          // setIsActivityOpen={setIsActivityOpen}
                          // isOffersOpen={isOffersOpen}
                          // setIsOffersOpen={setIsOffersOpen}
                          type="chonk"
                          tokenId={id}
                          address={address}
                      /> */}

                  <ActivitySection
                    tokenId={id}
                    address={address}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:hidden">
                <Link href={`/chonks/${id}`}>
                  <h1 className="text-[28px] mt-3 font-bold text-center hover:underline">
                    Chonk #{id}
                  </h1>
                </Link>

                <img
                  src={tokenData.image}
                  alt={`Chonk ${id}`}
                  className="w-full h-auto p-4"
                />

                <OwnershipSection
                  id={id}
                  tokenData={tokenData}
                  owner={owner}
                  address={address}
                />

                <PriceAndActionsSection
                  chonkId={parseInt(id)}
                  isOwner={isOwner}
                  refetchOwner={refetchOwner}
                  // price={formattedPrice}
                  // priceUSD={formattedPrice ? formattedPrice * 3500 : 0}
                  // isOfferSpecific={isOfferSpecific}
                  // canAcceptOffer={canAcceptOffer}

                  // hasActiveOffer={hasActiveOffer}
                  // hasActiveBid={hasActiveBid}
                  // chonkBid={chonkBid}
                  // onListingSuccess={() => {
                  //     setIsListingSuccess(true);
                  // }}
                />

                <TraitsSection
                  chonkId={id}
                  tokenData={tokenData}
                  equippedTraits={currentChonk}
                  isEquippedTraitsOpen={isEquippedTraitsOpen}
                  onToggleEquippedTraits={() =>
                    setIsEquippedTraitsOpen(!isEquippedTraitsOpen)
                  }
                  isTraitsOpen={isTraitsOpen}
                  onToggleTraits={() => setIsTraitsOpen(!isTraitsOpen)}
                  type="chonk"
                />
              </div>
            </>
          ) : (
            <Loading />
          )}
        </main>
      </div>
    </>
  );
}

// @ts-ignore
export async function getServerSideProps(context) {
  const { id } = context.params;

  if (!id) {
    return {
      notFound: true,
    };
  }

  return {
    props: { id },
  };
}
