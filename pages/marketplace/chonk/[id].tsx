import Head from 'next/head'
import MenuBar from '@/components/marketplace/MenuBar';
import Link from 'next/link';
import { useState, useEffect } from "react";
import { baseSepolia } from "viem/chains";
import { useReadContract, useWalletClient, useAccount } from "wagmi";
import { TokenboundClient } from "@tokenbound/sdk";
import { Chonk } from "@/types/Chonk";
import {
    mainABI,
    mainContract,
    traitsContract,
    tokenURIABI,
    traitsABI,
} from "@/contract_data";
import { StoredPeter } from "@/types/StoredPeter";
import { Category } from "@/types/Category";
import OwnershipSection from "@/components/marketplace/OwnershipSection";
import TraitsSection from '@/components/marketplace/TraitsSection';
import ActivityAndOffersSection from '@/components/marketplace/ActivityAndOffersSection';
import PriceAndActionsSection from '@/components/marketplace/PriceAndActionsSection';



type CurrentChonk = {
    tokenId: number;
    hat: {
        tokenId: number; // 0 if not equipped
        category: Category;
        isEquipped: boolean;
    };
    hair: {
        tokenId: number;
        category: Category;
        isEquipped: boolean;
    };
    glasses: {
        tokenId: number;
        category: Category;
        isEquipped: boolean;
    };
    handheld: {
        tokenId: number;
        category: Category;
        isEquipped: boolean;
    };
    shirt: {
        tokenId: number;
        category: Category;
        isEquipped: boolean;
    };
    pants: {
        tokenId: number;
        category: Category;
        isEquipped: boolean;
    };
    shoes: {
        tokenId: number;
        category: Category;
        isEquipped: boolean;
    };
};


export function decodeAndSetData(data: string, setData: (data: Chonk) => void) {
    // const decodedContent = decodeURIComponent(data);
    // const base64String = decodedContent.split("data:application/json,")[1];
    // // Parse as JSON and stringify with proper formatting
    // const jsonData = JSON.parse(base64String);

    // console.log(jsonData);

    const base64String = data.split(",")[1];
    const jsonString = atob(base64String);
    const jsonData = JSON.parse(jsonString) as Chonk;

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

    const { data: walletClient } = useWalletClient();
    const tokenboundClient = new TokenboundClient({
        walletClient,
        chainId: baseSepolia.id,
    });

    const [tokenData, setTokenData] = useState<Chonk | null>(null);
    const [filteredTraitTokenIds, setFilteredTraitTokenIds] = useState<BigInt[]>(
        []
    );

    const [currentChonk, setCurrentChonk] = useState<CurrentChonk | null>(null);

    // Get main body tokenURI
    const { data: tokenURIData } = useReadContract({
        address: mainContract,
        abi: tokenURIABI,
        functionName: TOKEN_URI,
        args: [BigInt(id)],
        chainId: baseSepolia.id,
    }) as { data: string };

    const { data: owner } = useReadContract({
        address: mainContract,
        abi: mainABI,
        functionName: "ownerOf",
        args: [BigInt(id)],
        chainId: baseSepolia.id,
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
        chainId: baseSepolia.id,
    }) as { data: StoredPeter };

    useEffect(() => {
        if (!storedPeter) return;

        console.log("storedPeter", storedPeter);

        setCurrentChonk({
            tokenId: parseInt(id),
            hat: {
                tokenId:
                    storedPeter.hatId === 0n ? 0 : parseInt(storedPeter.hatId.toString()),
                category: Category.Hat,
                isEquipped: storedPeter.hatId !== 0n,
            },
            hair: {
                tokenId:
                    storedPeter.hairId === 0n
                        ? 0
                        : parseInt(storedPeter.hairId.toString()),
                category: Category.Shirt,
                isEquipped: storedPeter.hairId !== 0n,
            },
            glasses: {
                tokenId:
                    storedPeter.glassesId === 0n
                        ? 0
                        : parseInt(storedPeter.glassesId.toString()),
                category: Category.Glasses,
                isEquipped: storedPeter.glassesId !== 0n,
            },
            handheld: {
                tokenId:
                    storedPeter.handheldId === 0n
                        ? 0
                        : parseInt(storedPeter.handheldId.toString()),
                category: Category.Handheld,
                isEquipped: storedPeter.handheldId !== 0n,
            },
            shirt: {
                tokenId:
                    storedPeter.shirtId === 0n
                        ? 0
                        : parseInt(storedPeter.shirtId.toString()),
                category: Category.Shirt,
                isEquipped: storedPeter.shirtId !== 0n,
            },
            pants: {
                tokenId:
                    storedPeter.pantsId === 0n
                        ? 0
                        : parseInt(storedPeter.pantsId.toString()),
                category: Category.Pants,
                isEquipped: storedPeter.pantsId !== 0n,
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
        chainId: baseSepolia.id,
    }) as { data: BigInt[] };

    console.log("allTraitTokenIds", allTraitTokenIds); // this is good, works

    // This gets the ids that are equipped to the chonk
    useEffect(() => {
        if (!storedPeter) return;

        console.log("storedPeter", storedPeter);

        const hatIdIndex =
            // @ts-ignore
            storedPeter.hatId === 0n
                ? null
                : allTraitTokenIds.findIndex(
                    (tokenId) => tokenId === storedPeter.hatId
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
            storedPeter.glassesId === 0n
                ? null
                : allTraitTokenIds.findIndex(
                    (tokenId) => tokenId === storedPeter.glassesId
                );

        const handheldIdIndex =
            // @ts-ignore
            storedPeter.handheldId === 0n
                ? null
                : allTraitTokenIds.findIndex(
                    (tokenId) => tokenId === storedPeter.handheldId
                );

        const shirtIdIndex =
            // @ts-ignore
            storedPeter.shirtId === 0n
                ? null
                : allTraitTokenIds.findIndex(
                    (tokenId) => tokenId === storedPeter.shirtId
                );

        const pantsIdIndex =
            // @ts-ignore
            storedPeter.pantsId === 0n
                ? null
                : allTraitTokenIds.findIndex(
                    (tokenId) => tokenId === storedPeter.pantsId
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

    return (

        <>
            <Head>
                <title>Chonk #{id} - Marketplace - Chonks</title>
                <meta name="description" content="View Chonk #${id} on the Chonks marketplace" />
                <meta property="og:title" content={`Chonk #${id} - Marketplace - Chonks`} />
                <meta property="og:description" content={`View Chonk #${id} on the Chonks marketplace`} />
                {tokenData && <meta property="og:image" content={tokenData.image} />}
                <meta property="og:url" content={`https://chonks.xyz/marketplace/chonk/${id}`} />
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
                                <Link href="/marketplace" className="flex items-center gap-2 mb-4 hover:opacity-70 transition-opacity">
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
                                        isOpen={isTraitsOpen}
                                        onToggle={() => setIsTraitsOpen(!isTraitsOpen)}
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
                                        price={10.25}
                                        priceUSD={23222}
                                    />

                                    <ActivityAndOffersSection
                                        isActivityOpen={isActivityOpen}
                                        setIsActivityOpen={setIsActivityOpen}
                                        isOffersOpen={isOffersOpen}
                                        setIsOffersOpen={setIsOffersOpen}
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