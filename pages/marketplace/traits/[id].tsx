import Head from 'next/head'
import MenuBar from '@/components/marketplace/MenuBar';
import Link from 'next/link';
import { useState, useEffect, useMemo } from "react";
import { baseSepolia } from "viem/chains";
import { useReadContract, useAccount } from "wagmi";
import { Trait } from "@/types/Trait";
import {
    mainABI,
    mainContract,
    marketplaceContract,
    marketplaceABI,
    traitsContract,
    tokenURIABI,
} from "@/contract_data";
import OwnershipSection from "@/components/marketplace/traits/OwnershipSection";
import TraitsSection from '@/components/marketplace/TraitsSection';
import ActivityAndOffersSection from '@/components/marketplace/ActivityAndOffersSection';
import PriceAndActionsSection from '@/components/marketplace/traits/PriceAndActionsSection';
import { formatEther } from "viem";
import { useMarketplaceActions } from "@/hooks/marketplaceAndMintHooks";

type TraitOffer = {
    priceInWei: bigint;
    seller: string;
    sellerTBA: string;
    onlySellTo: string;
}

export function decodeAndSetData(data: string, setData: (data: Trait) => void) {
    const base64String = data.split(",")[1];
    const jsonString = atob(base64String);
    const jsonData = JSON.parse(jsonString) as Trait;

    console.log(jsonData);

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

    const [tokenData, setTokenData] = useState<Trait | null>(null);
    const [filteredTraitTokenIds, setFilteredTraitTokenIds] = useState<BigInt[]>(
        []
    );

    // const [currentChonk, setCurrentChonk] = useState<CurrentChonk | null>(null);

    const { hasActiveBid, chonkBid } = useMarketplaceActions(parseInt(id));

    //get Trait Offers - accessing the offers directly from mapping
    // but we now have : getTraitOffer
    const { data: traitOfferArray } = useReadContract({
        address: marketplaceContract,
        abi: marketplaceABI,
        functionName: "traitOffers",
        args: [BigInt(id)],
        chainId: baseSepolia.id,
    }) as { data: [bigint, string, string, string, string] };

    // Convert array to object
    const traitOffer: TraitOffer | null = useMemo(() => {
        if (!traitOfferArray) return null;
        return {
            priceInWei: traitOfferArray[0],
            seller: traitOfferArray[1],
            sellerTBA: traitOfferArray[2],
            onlySellTo: traitOfferArray[3],
        };
    }, [traitOfferArray]);

    // Add this console log to see the raw response
    useEffect(() => {
        console.group("Raw Response");
        console.log("Raw traitOffer:", traitOffer);
        if (Array.isArray(traitOffer)) {
            console.log("Is array, length:", traitOffer.length);
            traitOffer.forEach((item, index) => {
                console.log(`Item ${index}:`, item);
            });
        } else {
            console.log("Is not array, type:", typeof traitOffer);
        }
        console.groupEnd();
    }, [traitOffer]);

    const formattedPrice = useMemo(() => {
        if (!traitOffer?.priceInWei) return null;
        console.log("Price in Wei before formatting:", traitOffer.priceInWei);
        return parseFloat(formatEther(traitOffer.priceInWei));
    }, [traitOffer]);

    const isOfferSpecific = useMemo(() => {
        if (!traitOffer?.onlySellTo) return false;
        return traitOffer.onlySellTo !== "0x0000000000000000000000000000000000000000";
    }, [traitOffer]);

    const canAcceptOffer = useMemo(() => {
        if (!traitOffer?.onlySellTo || !address || !isOfferSpecific) return false;
        return traitOffer.onlySellTo.toLowerCase() === address.toLowerCase();
    }, [traitOffer, address, isOfferSpecific]);

    // Get main body tokenURI
    const { data: tokenURIData } = useReadContract({
        address: traitsContract,
        abi: tokenURIABI,
        functionName: TOKEN_URI,
        args: [BigInt(id)],
        chainId: baseSepolia.id,
    }) as { data: string };

    // const { data: owner } = useReadContract({
    //     address: traitsContract,
    //     abi: traitsABI,
    //     functionName: "ownerOf",
    //     args: [BigInt(id)],
    //     chainId: baseSepolia.id,
    // }) as { data: string };

    // // Add this new query to get the tokenId from the TBA address
    // const { data: tokenIdOfTBA } = useReadContract({
    //     address: mainContract,
    //     abi: mainABI,
    //     functionName: "tbaAddressToTokenId",
    //     args: [owner],
    //     chainId: baseSepolia.id,
    // }) as { data: bigint };

    // const { data: ownerOfTraitOwner } = useReadContract({
    //     address: mainContract,
    //     abi: mainABI,
    //     functionName: "ownerOf",
    //     args: [tokenIdOfTBA ? BigInt(tokenIdOfTBA) : undefined],
    //     chainId: baseSepolia.id,
    // }) as { data: string };

    // console.log("owner (TBA address)", owner);
    // console.log("tokenId of owning Chonk", tokenIdOfTBA?.toString());
    // console.log("owner of trait owner", ownerOfTraitOwner);


    //getFullPictureForTrait
    const { data: fullPictureForTrait, error: fullPictureError } = useReadContract({
        address: mainContract,
        abi: mainABI,
        functionName: "getFullPictureForTrait",
        args: [BigInt(id)],
        chainId: baseSepolia.id,
    }) as { data: [string, bigint, string], error: Error };

    useEffect(() => {
        if (fullPictureError) {
            console.error("Error fetching full picture for trait:", {
                error: fullPictureError,
                traitId: id,
                contractAddress: mainContract
            });
        }
        if (fullPictureForTrait) {
            console.log("Successfully fetched full picture for trait:", {
                traitId: id,
                data: fullPictureForTrait
            });
        }
    }, [fullPictureForTrait, fullPictureError, id]);

    const [owner, tokenIdOfTBA, ownerOfTraitOwner] = fullPictureForTrait || [];

    console.log("traitOwnerTBA", owner);
    console.log("chonkTokenId", tokenIdOfTBA?.toString());
    console.log("chonkOwner", ownerOfTraitOwner);


    // function checkIfTraitIsEquipped(uint256 _chonkId, uint256 _traitId) public view returns (bool) {
    //     IPeterStorage.StoredPeter memory storedPeter = getPeter(_chonkId);
    //     return storedPeter.headId == _traitId ||
    //         storedPeter.hairId == _traitId ||
    //         storedPeter.faceId == _traitId ||
    //         storedPeter.accessoryId == _traitId ||
    //         storedPeter.topId == _traitId ||
    //         storedPeter.bottomId == _traitId ||
    //         storedPeter.shoesId == _traitId;
    // }

    const { data: isEquipped } = useReadContract({
        address: mainContract,
        abi: mainABI,
        functionName: "checkIfTraitIsEquipped",
        args: [tokenIdOfTBA, BigInt(id)],
        chainId: baseSepolia.id,
    }) as { data: boolean };


    useEffect(() => {
        if (tokenURIData) {
            decodeAndSetData(tokenURIData, setTokenData);
        }
        // else {
        //   console.log("No tokenURI data");
        // }
    }, [tokenURIData]);

    // const account = tokenboundClient.getAccount({
    //     tokenContract: mainContract,
    //     tokenId: id.toString(),
    // });

    // console.log(" ===== account (this is the TBA of the main token id, not trait)", account);



    // // Get all the traits that the TBA owns, equipped or not (ex  [1n, 2n, 3n, 4n, 5n])
    // const { data: allTraitTokenIds } = useReadContract({
    //     address: traitsContract,
    //     abi: traitsABI,
    //     functionName: "walletOfOwner",
    //     args: [account],
    //     chainId: baseSepolia.id,
    // }) as { data: BigInt[] };

    // console.log("allTraitTokenIds", allTraitTokenIds); // this is good, works

    // Add these console logs
    useEffect(() => {
        console.log("Raw contract response:", traitOffer);
        if (traitOffer) {
            try {
                // Log each property individually
                console.group("Chonk Offer Details");
                if (traitOffer.priceInWei) {
                    console.log("Price in Wei:", traitOffer.priceInWei.toString());
                } else {
                    console.log("Price in Wei: undefined");
                }
                console.log("Seller:", traitOffer.seller || "undefined");
                console.log("Seller TBA:", traitOffer.sellerTBA || "undefined");
                console.log("Only sell to:", traitOffer.onlySellTo || "undefined");
                console.groupEnd();

                if (address) {
                    console.group("Wallet Info");
                    console.log("Connected wallet:", address);
                    console.log("Can accept offer:", traitOffer.onlySellTo?.toLowerCase() === address.toLowerCase());
                    console.groupEnd();
                }
            } catch (error) {
                console.error("Error accessing traitOffer properties:", error);
                console.log("traitOffer type:", typeof traitOffer);
                console.log("traitOffer keys:", Object.keys(traitOffer));
            }
        } else {
            console.log("No offer found for this Chonk");
        }
    }, [traitOffer, address]);

    const isOwner = useMemo(() => {
        if (!owner || !address) return false;
        return owner.toLowerCase() === address.toLowerCase();
    }, [owner, address]);

    const hasActiveOffer = useMemo(() => Boolean(traitOffer && traitOffer.priceInWei > 0n), [traitOffer]);

    return (
        <>
            <Head>
                <title>Trait #{id} - Marketplace - Chonks</title>
                <meta name="description" content="View Trait #${id} on the Chonks marketplace" />
                <meta property="og:title" content={`Trait #${id} - Marketplace - Chonks`} />
                <meta property="og:description" content={`View Trait #${id} on the Chonks marketplace`} />
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
                                <Link href="/marketplace/traits" className="flex items-center gap-2 mb-4 hover:opacity-70 transition-opacity">
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
                                        equippedTraits={null}
                                        isOpen={isTraitsOpen}
                                        onToggle={() => setIsTraitsOpen(!isTraitsOpen)}
                                        type="trait"
                                    />

                                </div>
                                <div className="w-3/5">

                                    <OwnershipSection
                                        id={id}
                                        tokenData={tokenData}
                                        owner={owner}
                                        tbaOwner={ownerOfTraitOwner}
                                        tokenIdOfTBA={tokenIdOfTBA?.toString()}
                                        address={address}
                                        isEquipped={isEquipped}
                                    />

                                    <PriceAndActionsSection
                                        traitId={parseInt(id)}
                                        tokenIdOfTBA={tokenIdOfTBA?.toString()}
                                        price={formattedPrice}
                                        priceUSD={formattedPrice ? formattedPrice * 3500 : 0}
                                        isOfferSpecific={isOfferSpecific}
                                        canAcceptOffer={canAcceptOffer}
                                        isOwner={isOwner}
                                        hasActiveOffer={hasActiveOffer}
                                        hasActiveBid={hasActiveBid}
                                        chonkBid={chonkBid}
                                        tbaOwner={ownerOfTraitOwner}
                                        isEquipped={isEquipped}
                                    />

                                    <ActivityAndOffersSection
                                        isActivityOpen={isActivityOpen}
                                        setIsActivityOpen={setIsActivityOpen}
                                        isOffersOpen={isOffersOpen}
                                        setIsOffersOpen={setIsOffersOpen}
                                        type="trait"
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
