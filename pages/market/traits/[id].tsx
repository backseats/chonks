import Head from "next/head";
import MenuBar from "@/components/MenuBar";
import { useState, useEffect, useMemo } from "react";
import { useReadContract, useWalletClient, useAccount } from "wagmi";
import {
  mainABI,
  mainContract,
  marketplaceContract,
  marketplaceABI,
  chainId,
} from "@/config";
import OwnershipSection from "@/components/marketplace/traits/OwnershipSection";
import TraitsSection from "@/components/marketplace/TraitsSection";
// import ActivityAndOffersSection from '@/components/marketplace/ActivityAndOffersSection';
import PriceAndActionsSection from "@/components/marketplace/traits/PriceAndActionsSection";
import { Address, getAddress } from "viem";
import Loading from "@/components/marketplace/Loading";
import { TokenboundClient } from "@tokenbound/sdk";
import { TraitMetadata, TraitMetadataResponse } from "@/types/TraitMetadata";
import { GET_TRAIT_METADATA_BY_ID } from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";
import ChonkRenderer from "@/components/ChonkRenderer";

export default function TraitDetail({ id }: { id: string }) {
  // const router = useRouter()
  // const { id } = router.query
  const [isActivityOpen, setIsActivityOpen] = useState(true);
  const [isOffersOpen, setIsOffersOpen] = useState(true);
  const [isTraitsOpen, setIsTraitsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { address } = useAccount();

  const { data: walletClient } = useWalletClient();
  const tokenboundClient = new TokenboundClient({
    walletClient,
    chainId,
  });

  //get Trait Offers - accessing the offers directly from mapping
  // but we now have : getTraitOffer
  const { data: traitOfferArray } = useReadContract({
    address: marketplaceContract,
    abi: marketplaceABI,
    functionName: "traitOffers",
    args: [BigInt(id)],
    chainId,
  }) as { data: [bigint, string, string, string, string] };

  // Convert array to object
  // const traitOffer: TraitOffer | null = useMemo(() => {
  //   if (!traitOfferArray) return null;
  //   return {
  //     priceInWei: traitOfferArray[0],
  //     seller: traitOfferArray[1],
  //     sellerTBA: traitOfferArray[2],
  //     onlySellTo: traitOfferArray[3],
  //   };
  // }, [traitOfferArray]);

  // // Add this console log to see the raw response
  // useEffect(() => {
  //   console.group("Raw Response");
  //   console.log("Raw traitOffer:", traitOffer);
  //   if (Array.isArray(traitOffer)) {
  //     console.log("Is array, length:", traitOffer.length);
  //     traitOffer.forEach((item, index) => {
  //       console.log(`Item ${index}:`, item);
  //     });
  //   } else {
  //     console.log("Is not array, type:", typeof traitOffer);
  //   }
  //   console.groupEnd();
  // }, [traitOffer]);

  // const formattedPrice = useMemo(() => {
  //   if (!traitOffer?.priceInWei) return null;
  //   console.log("Price in Wei before formatting:", traitOffer.priceInWei);
  //   return parseFloat(formatEther(traitOffer.priceInWei));
  // }, [traitOffer]);

  // const isOfferSpecific = useMemo(() => {
  //   if (!traitOffer?.onlySellTo) return false;
  //   return (
  //     traitOffer.onlySellTo !== "0x0000000000000000000000000000000000000000"
  //   );
  // }, [traitOffer]);

  // const canAcceptOffer = useMemo(() => {
  //   if (!traitOffer?.onlySellTo || !address || !isOfferSpecific) return false;
  //   return traitOffer.onlySellTo.toLowerCase() === address.toLowerCase();
  // }, [traitOffer, address, isOfferSpecific]);

  // Get main body tokenURI
  // const { data: tokenURIData } = useReadContract({
  //   address: traitsContract,
  //   abi: mainABI,
  //   functionName: TOKEN_URI,
  //   args: [BigInt(id)],
  //   chainId,
  // }) as { data: string };

  // const { data: owner } = useReadContract({
  //     address: traitsContract,
  //     abi: traitsABI,
  //     functionName: "ownerOf",
  //     args: [BigInt(id)],
  //     chainId
  // }) as { data: string };

  // // Add this new query to get the tokenId from the TBA address
  // const { data: tokenIdOfTBA } = useReadContract({
  //     address: mainContract,
  //     abi: mainABI,
  //     functionName: "tbaAddressToTokenId",
  //     args: [owner],
  //     chainId,
  // }) as { data: bigint };

  // const { data: ownerOfTraitOwner } = useReadContract({
  //     address: mainContract,
  //     abi: mainABI,
  //     functionName: "ownerOf",
  //     args: [tokenIdOfTBA ? BigInt(tokenIdOfTBA) : undefined],
  //     chainId,
  // }) as { data: string };

  // console.log("owner (TBA address)", owner);
  // console.log("tokenId of owning Chonk", tokenIdOfTBA?.toString());
  // console.log("owner of trait owner", ownerOfTraitOwner);

  //getFullPictureForTrait
  const {
    data: fullPictureForTrait,
    error: fullPictureError,
    refetch: refetchFullPictureForTrait,
  } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: "getFullPictureForTrait",
    args: [BigInt(id)],
    chainId,
  }) as {
    data: [string, bigint, string, boolean];
    error: Error;
    refetch: () => void;
  };

  useEffect(() => {
    if (fullPictureError) {
      console.error("Error fetching full picture for trait:", {
        error: fullPictureError,
        traitId: id,
        contractAddress: mainContract,
      });
    }
    if (fullPictureForTrait) {
      console.log("Successfully fetched full picture for trait:", {
        traitId: id,
        data: fullPictureForTrait,
      });
    }
  }, [fullPictureForTrait, fullPictureError, id]);

  const [owner, tokenIdOfTBA, ownerOfTraitOwner, isEquipped] =
    fullPictureForTrait || [];

  const chonkId = tokenIdOfTBA?.toString() ?? null;

  const tbaAddress = chonkId
    ? tokenboundClient.getAccount({
        tokenContract: mainContract,
        tokenId: tokenIdOfTBA?.toString(),
        chainId,
      })
    : null;

  // function checkIfTraitIsEquipped(uint256 _chonkId, uint256 _traitId) public view returns (bool) {
  //     IChonkStorage.StoredChonk memory storedChonk = getChonk(_chonkId);
  //     return storedChonk.headId == _traitId ||
  //         storedChonk.hairId == _traitId ||
  //         storedChonk.faceId == _traitId ||
  //         storedChonk.accessoryId == _traitId ||
  //         storedChonk.topId == _traitId ||
  //         storedChonk.bottomId == _traitId ||
  //         storedChonk.shoesId == _traitId;
  // }

  // const { data: isEquipped } = useReadContract({
  //     address: mainContract,
  //     abi: mainABI,
  //     functionName: "checkIfTraitIsEquipped",
  //     args: [tokenIdOfTBA, BigInt(id)],
  //     chainId,
  // }) as { data: boolean };

  // const account = tokenboundClient.getAccount({
  //     tokenContract: mainContract,
  //     tokenId: id.toString(),
  //     chainId
  // });

  // console.log(" ===== account (this is the TBA of the main token id, not trait)", account);

  // // Get all the traits that the TBA owns, equipped or not (ex  [1n, 2n, 3n, 4n, 5n])
  // const { data: allTraitTokenIds } = useReadContract({
  //     address: traitsContract,
  //     abi: traitsABI,
  //     functionName: "walletOfOwner",
  //     args: [account],
  //     chainId,
  // }) as { data: BigInt[] };

  // console.log("allTraitTokenIds", allTraitTokenIds); // this is good, works

  // Add these console logs
  // useEffect(() => {
  //   console.log("Raw contract response:", traitOffer);
  //   if (traitOffer) {
  //     try {
  //       // Log each property individually
  //       console.group("Trait Offer Details");
  //       if (traitOffer.priceInWei) {
  //         console.log("Price in Wei:", traitOffer.priceInWei.toString());
  //       } else {
  //         console.log("Price in Wei: undefined");
  //       }
  //       console.log("Seller:", traitOffer.seller || "undefined");
  //       console.log("Seller TBA:", traitOffer.sellerTBA || "undefined");
  //       console.log("Only sell to:", traitOffer.onlySellTo || "undefined");
  //       console.groupEnd();

  //       if (address) {
  //         console.group("Wallet Info");
  //         console.log("Connected wallet:", address);
  //         console.log(
  //           "Can accept offer:",
  //           traitOffer.onlySellTo?.toLowerCase() === address.toLowerCase()
  //         );
  //         console.groupEnd();
  //       }
  //     } catch (error) {
  //       console.error("Error accessing traitOffer properties:", error);
  //       console.log("traitOffer type:", typeof traitOffer);
  //       console.log("traitOffer keys:", Object.keys(traitOffer));
  //     }
  //   } else {
  //     console.log("No offer found for this Trait");
  //   }
  // }, [traitOffer, address]);

  const isOwner = useMemo(() => {
    if (!owner || !address) return false;
    return getAddress(owner) === getAddress(address);
  }, [owner, address]);

  const [traitMetadata, setTraitMetadata] = useState<TraitMetadata | null>(
    null
  );

  // Fetch trait metadata from GraphQL
  useEffect(() => {
    const fetchTraitMetadata = async () => {
      try {
        const { data } = await client.query<TraitMetadataResponse>({
          query: GET_TRAIT_METADATA_BY_ID,
          variables: { id: parseInt(id) },
        });

        if (data?.traitMetadata?.items?.length > 0) {
          setTraitMetadata(data.traitMetadata.items[0]);
        }
      } catch (error) {
        console.error("Error fetching trait metadata:", error);
      }
    };

    fetchTraitMetadata();
  }, [id]);

  return (
    <>
      <Head>
        <title>Trait #{id} - Marketplace - Chonks</title>
        <meta
          name="description"
          content={`View Trait #${id} on the Chonks Market`}
        />
        <meta
          property="og:title"
          content={`Trait #${id} - Marketplace - Chonks`}
        />
        <meta
          property="og:description"
          content={`View Trait #${id} on the Chonks Market`}
        />

        {/* // TODO: add trait image */}
        {/* {traitImage && <meta property="og:image" content={traitImage} />} */}

        <meta
          property="og:url"
          content={`https://chonks.xyz/market/traits/${id}`}
        />
        <meta property="og:type" content="website" />
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
          {traitMetadata ? (
            <>
              <div className="hidden sm:flex sm:flex-row sm:gap-[3.45vw] sm:py-[1.725vw] sm:px-[3.45vw]">
                <div className="w-2/5 h-fit">
                  <ChonkRenderer bytes={traitMetadata.colorMap.slice(2)} />
                </div>

                <div className="w-3/5">
                  <OwnershipSection
                    owner={owner}
                    tbaOwner={ownerOfTraitOwner}
                    tokenIdOfTBA={tokenIdOfTBA?.toString()}
                    address={address}
                    isEquipped={isEquipped}
                    traitName={traitMetadata?.traitName}
                  />

                  <PriceAndActionsSection
                    isOwner={isOwner}
                    chonkId={Number(chonkId)}
                    traitId={parseInt(id)}
                    tbaOwner={ownerOfTraitOwner}
                    isEquipped={isEquipped}
                    tbaAddress={tbaAddress as Address | null}
                    refetchFullPictureForTrait={refetchFullPictureForTrait}
                  />

                  {/* <ActivityAndOffersSection
                                        isActivityOpen={isActivityOpen}
                                        setIsActivityOpen={setIsActivityOpen}
                                        isOffersOpen={isOffersOpen}
                                        setIsOffersOpen={setIsOffersOpen}
                                        type="trait"
                                        tokenId={id}
                                        address={address}
                                    /> */}
                </div>
              </div>

              <div className="flex flex-col sm:hidden">
                <h1 className="text-[22px] mt-3 font-bold text-center px-4">
                  {traitMetadata?.traitName ? `${traitMetadata.traitName}` : ""}
                </h1>

                <div className="w-full h-auto p-4">
                  <ChonkRenderer bytes={traitMetadata.colorMap.slice(2)} />
                </div>

                <OwnershipSection
                  owner={owner}
                  tbaOwner={ownerOfTraitOwner}
                  tokenIdOfTBA={tokenIdOfTBA?.toString()}
                  address={address}
                  isEquipped={isEquipped}
                  traitName={traitMetadata?.traitName}
                />

                <PriceAndActionsSection
                  isOwner={isOwner}
                  chonkId={Number(chonkId)}
                  traitId={parseInt(id)}
                  tbaOwner={ownerOfTraitOwner}
                  isEquipped={isEquipped}
                  tbaAddress={tbaAddress as Address | null}
                  refetchFullPictureForTrait={refetchFullPictureForTrait}
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
