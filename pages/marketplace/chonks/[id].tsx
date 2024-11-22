import Head from 'next/head'
import MenuBar from '@/components/marketplace/MenuBar';
import Link from 'next/link';
import { useState, useEffect, useMemo } from "react";
import { useReadContract, useWalletClient, useAccount } from "wagmi";
import { TokenboundClient } from "@tokenbound/sdk";
import { Chonk } from "@/types/Chonk";
import {
    mainABI,
    mainContract,
    marketplaceContract,
    marketplaceABI,
    traitsContract,
    tokenURIABI,
    traitsABI,
    chainId,
} from "@/contract_data";
import { StoredPeter } from "@/types/StoredPeter";
import { Category } from "@/types/Category";
import OwnershipSection from "@/components/marketplace/chonks/OwnershipSection";
import TraitsSection from '@/components/marketplace/TraitsSection';
import ActivityAndOffersSection from '@/components/marketplace/ActivityAndOffersSection';
import PriceAndActionsSection from '@/components/marketplace/chonks/PriceAndActionsSection';
// import { formatEther } from "viem";
// import { useMarketplaceActions } from "@/hooks/marketplaceAndMintHooks";
import { CurrentChonk } from "@/types/CurrentChonk";

// type ChonkOffer = {
//     priceInWei: bigint;
//     seller: string;
//     sellerTBA: string;
//     onlySellTo: string;
//     encodedTraitIds: string;
// }

export function decodeAndSetData(data: string, setData: (data: Chonk) => void) {
    // const decodedContent = decodeURIComponent(data);
    // const base64String = decodedContent.split("data:application/json,")[1];
    // // Parse as JSON and stringify with proper formatting
    // const jsonData = JSON.parse(base64String);

    // console.log(jsonData);

    const base64String = data.split(",")[1];
    const jsonString = atob(base64String);
    const jsonData = JSON.parse(jsonString) as Chonk;

    // console.log(jsonData);

    setData(jsonData);
}

export default function ChonkDetail({ id }: { id: string }) {
    // const router = useRouter()
    // const { id } = router.query
    const [isActivityOpen, setIsActivityOpen] = useState(true);
    const [isOffersOpen, setIsOffersOpen] = useState(true);
    const [isTraitsOpen, setIsTraitsOpen] = useState(true);

    const TOKEN_URI = "tokenURI";

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

    // const { hasActiveBid, chonkBid } = useMarketplaceActions(parseInt(id));

    // //get Chonk Offers - accessing the offers directly from mapping
    // // but we now have : getChonkOffer
    // const { data: chonkOfferArray } = useReadContract({
    //     address: marketplaceContract,
    //     abi: marketplaceABI,
    //     functionName: "chonkOffers",
    //     args: [BigInt(id)],
    //     chainId,
    // }) as { data: [bigint, string, string, string, string] };

    // // Convert array to object
    // const chonkOffer: ChonkOffer | null = useMemo(() => {
    //     if (!chonkOfferArray) return null;
    //     return {
    //         priceInWei: chonkOfferArray[0],
    //         seller: chonkOfferArray[1],
    //         sellerTBA: chonkOfferArray[2],
    //         onlySellTo: chonkOfferArray[3],
    //         encodedTraitIds: chonkOfferArray[4],
    //     };
    // }, [chonkOfferArray]);

    // // Add this console log to see the raw response
    // useEffect(() => {
    //     console.group("Raw Response");
    //     console.log("Raw chonkOffer:", chonkOffer);
    //     if (Array.isArray(chonkOffer)) {
    //         console.log("Is array, length:", chonkOffer.length);
    //         chonkOffer.forEach((item, index) => {
    //             console.log(`Item ${index}:`, item);
    //         });
    //     } else {
    //         console.log("Is not array, type:", typeof chonkOffer);
    //     }
    //     console.groupEnd();
    // }, [chonkOffer]);

    // const formattedPrice = useMemo(() => {
    //     if (!chonkOffer?.priceInWei) return null;
    //     console.log("Price in Wei before formatting:", chonkOffer.priceInWei);
    //     return parseFloat(formatEther(chonkOffer.priceInWei));
    // }, [chonkOffer]);

    // const isOfferSpecific = useMemo(() => {
    //     if (!chonkOffer?.onlySellTo) return false;
    //     return chonkOffer.onlySellTo !== "0x0000000000000000000000000000000000000000";
    // }, [chonkOffer]);

    // const canAcceptOffer = useMemo(() => {
    //     if (!chonkOffer?.onlySellTo || !address || !isOfferSpecific) return false;
    //     return chonkOffer.onlySellTo.toLowerCase() === address.toLowerCase();
    // }, [chonkOffer, address, isOfferSpecific]);

    // Get main body tokenURI
    const { data: tokenURIData } = useReadContract({
        address: mainContract,
        abi: tokenURIABI,
        functionName: TOKEN_URI,
        args: [BigInt(id)],
        chainId,
    }) as { data: string };

    const { data: owner } = useReadContract({
        address: mainContract,
        abi: mainABI,
        functionName: "ownerOf",
        args: [BigInt(id)],
        chainId,
    }) as { data: string };

    useEffect(() => {
        if (tokenURIData) {
            decodeAndSetData(tokenURIData, setTokenData);
        }
        // else {
        //   console.log("No tokenURI data");
        // }
    }, [tokenURIData]);

    // Get the trait ids that are equipped to the body
    const { data: storedPeter } = useReadContract({
        address: mainContract,
        abi: mainABI,
        functionName: "getPeter",
        args: [BigInt(id)],
        chainId,
    }) as { data: StoredPeter };

    useEffect(() => {
        if (!storedPeter) return;

        console.log("storedPeter", storedPeter);

        setCurrentChonk({
            tokenId: parseInt(id),
            head: {
                tokenId:
                    storedPeter.headId === 0n ? 0 : parseInt(storedPeter.headId.toString()),
                category: Category.Head,
                isEquipped: storedPeter.headId !== 0n,
            },
            hair: {
                tokenId:
                    storedPeter.hairId === 0n
                        ? 0
                        : parseInt(storedPeter.hairId.toString()),
                category: Category.Top,
                isEquipped: storedPeter.hairId !== 0n,
            },
            face: {
                tokenId:
                    storedPeter.faceId === 0n
                        ? 0
                        : parseInt(storedPeter.faceId.toString()),
                category: Category.Face,
                isEquipped: storedPeter.faceId !== 0n,
            },
            accessory: {
                tokenId:
                    storedPeter.accessoryId === 0n
                        ? 0
                        : parseInt(storedPeter.accessoryId.toString()),
                category: Category.Accessory,
                isEquipped: storedPeter.accessoryId !== 0n,
            },
            top: {
                tokenId:
                    storedPeter.topId === 0n
                        ? 0
                        : parseInt(storedPeter.topId.toString()),
                category: Category.Top,
                isEquipped: storedPeter.topId !== 0n,
            },
            bottom: {
                tokenId:
                    storedPeter.bottomId === 0n
                        ? 0
                        : parseInt(storedPeter.bottomId.toString()),
                category: Category.Bottom,
                isEquipped: storedPeter.bottomId !== 0n,
            },
            shoes: {
                tokenId:
                    storedPeter.shoesId === 0n
                        ? 0
                        : parseInt(storedPeter.shoesId.toString()),
                category: Category.Shoes,
                isEquipped: storedPeter.shoesId !== 0n,
            },
        });
    }, [storedPeter]);

    useEffect(() => {
        console.log("currentChonk", currentChonk);
    }, [currentChonk]);

    const account = tokenboundClient.getAccount({
        tokenContract: mainContract,
        tokenId: id.toString(),
    });

    // if (address) {
    //   console.log("address is", address);
    //   console.log("tba address is", account);
    // }

    // Get all the traits that the TBA owns, equipped or not (ex  [1n, 2n, 3n, 4n, 5n])
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
        if (!storedPeter) return;

        console.log("storedPeter", storedPeter);

        const hatIdIndex =
            // @ts-ignore
            storedPeter.headId === 0n
                ? null
                : allTraitTokenIds.findIndex(
                    (tokenId) => tokenId === storedPeter.headId
                );

        const hairIdIndex =
            // @ts-ignore
            storedPeter.hairId === 0n
                ? null
                : allTraitTokenIds.findIndex(
                    (tokenId) => tokenId === storedPeter.hairId
                );

        const glassesIdIndex =
            // @ts-ignore
            storedPeter.accessoryId === 0n
                ? null
                : allTraitTokenIds.findIndex(
                    (tokenId) => tokenId === storedPeter.accessoryId
                );

        const handheldIdIndex =
            // @ts-ignore
            storedPeter.accessoryId === 0n
                ? null
                : allTraitTokenIds.findIndex(
                    (tokenId) => tokenId === storedPeter.accessoryId
                );

        const shirtIdIndex =
            // @ts-ignore
            storedPeter.topId === 0n
                ? null
                : allTraitTokenIds.findIndex(
                    (tokenId) => tokenId === storedPeter.topId
                );

        const pantsIdIndex =
            // @ts-ignore
            storedPeter.bottomId === 0n
                ? null
                : allTraitTokenIds.findIndex(
                    (tokenId) => tokenId === storedPeter.bottomId
                );

        const shoesIdIndex =
            // @ts-ignore
            storedPeter.shoesId === 0n
                ? null
                : allTraitTokenIds.findIndex(
                    (tokenId) => tokenId === storedPeter.shoesId
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
    }, [allTraitTokenIds, storedPeter]);

    // // Add these console logs
    // useEffect(() => {
    //     console.log("Raw contract response:", chonkOffer);
    //     if (chonkOffer) {
    //         try {
    //             // Log each property individually
    //             console.group("Chonk Offer Details");
    //             if (chonkOffer.priceInWei) {
    //                 console.log("Price in Wei:", chonkOffer.priceInWei.toString());
    //             } else {
    //                 console.log("Price in Wei: undefined");
    //             }
    //             console.log("Seller:", chonkOffer.seller || "undefined");
    //             console.log("Seller TBA:", chonkOffer.sellerTBA || "undefined");
    //             console.log("Only sell to:", chonkOffer.onlySellTo || "undefined");
    //             console.log("Encoded trait IDs:", chonkOffer.encodedTraitIds || "undefined");
    //             console.groupEnd();

    //             if (address) {
    //                 console.group("Wallet Info");
    //                 console.log("Connected wallet:", address);
    //                 console.log("Can accept offer:", chonkOffer.onlySellTo?.toLowerCase() === address.toLowerCase());
    //                 console.groupEnd();
    //             }
    //         } catch (error) {
    //             console.error("Error accessing chonkOffer properties:", error);
    //             console.log("chonkOffer type:", typeof chonkOffer);
    //             console.log("chonkOffer keys:", Object.keys(chonkOffer));
    //         }
    //     } else {
    //         console.log("No offer found for this Chonk");
    //     }
    // }, [chonkOffer, address]);

    // const hasActiveOffer = useMemo(() => {
    //     return Boolean(chonkOffer && chonkOffer.priceInWei > 0n);
    // }, [chonkOffer]);

    const isOwner = useMemo(() => {
        if (!owner || !address) return false;
        return owner.toLowerCase() === address.toLowerCase();
    }, [owner, address]);

    // const [isListingSuccess, setIsListingSuccess] = useState(false);

   

    

    return (
        <>
            <Head>
                <title>Chonk #{id} - Marketplace - Chonks</title>
                <meta name="description" content="View Chonk #${id} on the Chonks marketplace" />
                <meta property="og:title" content={`Chonk #${id} - Marketplace - Chonks`} />
                <meta property="og:description" content={`View Chonk #${id} on the Chonks marketplace`} />
                {tokenData && <meta property="og:image" content={tokenData.image} />}
                <meta property="og:url" content={`https://chonks.xyz/marketplace/chonks/${id}`} />
                <meta property="og:type" content="website" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
                />
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="manifest" href="/site.webmanifest" />
            </Head>

            <div className="min-h-screen w-full text-black font-source-code-pro font-weight-600 text-[3vw] sm:text-[1.5vw]">

                <MenuBar />

                <main className="w-full border-t border-gray-300">
                    {tokenData ? (
                        <div>
                            <section className="flex pt-[1.725vw] px-[3.45vw]">
                                <Link href="/marketplace/chonks" className="flex items-center gap-2 mb-4 hover:opacity-70 transition-opacity">
                                    <span className="text-[1.2vw]">←</span>
                                    <span className="text-[1.2vw]">Back</span>
                                </Link>
                            </section>

                            <section className="flex flex-row gap-[3.45vw] py-[1.725vw] px-[3.45vw]">
                                <div className="w-2/5">

                                    <img
                                        src={tokenData.image}
                                        alt={`Chonk ${id}`}
                                        className="w-full h-auto"
                                    />

                                    <TraitsSection
                                        id={id}
                                        tokenData={tokenData}
                                        equippedTraits={currentChonk}
                                        isOpen={isTraitsOpen}
                                        onToggle={() => setIsTraitsOpen(!isTraitsOpen)}
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

                                    <ActivityAndOffersSection
                                        isActivityOpen={isActivityOpen}
                                        setIsActivityOpen={setIsActivityOpen}
                                        isOffersOpen={isOffersOpen}
                                        setIsOffersOpen={setIsOffersOpen}
                                        type="chonk"
                                        tokenId={id}
                                        address={address}
                                    />

                                </div>
                            </section>
                        </div>

                    ) : (
                        <section className="flex pt-[1.725vw] px-[3.45vw]">
                            <span className="text-[1.2vw]">Loading...</span>
                        </section>
                    )}
                </main>
            </div>
        </>
    )
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
