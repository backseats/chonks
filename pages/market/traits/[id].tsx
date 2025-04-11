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
import ActivitySection from "@/components/marketplace/traits/ActivitySection";
import PriceAndActionsSection from "@/components/marketplace/traits/PriceAndActionsSection";
import { Address, getAddress } from "viem";
import Loading from "@/components/marketplace/Loading";
import { TokenboundClient } from "@tokenbound/sdk";
import { TraitMetadata, TraitMetadataResponse } from "@/types/TraitMetadata";
import { GET_TRAIT_METADATA_BY_ID } from "@/lib/graphql/queries";
import client from "@/lib/apollo-client";
import ChonkRenderer from "@/components/ChonkRenderer";
import Link from "next/link";
import { IoArrowBackOutline } from "react-icons/io5";
import Footer from "@/components/layout/Footer";
export default function TraitDetail({ id }: { id: string }) {
  const { address } = useAccount();

  const { data: walletClient } = useWalletClient();
  const tokenboundClient = new TokenboundClient({
    walletClient,
    chainId,
  });

  // get Trait Offers - accessing the offers directly from mapping
  // but we now have: getTraitOffer
  const { data: traitOfferArray } = useReadContract({
    address: marketplaceContract,
    abi: marketplaceABI,
    functionName: "traitOffers",
    args: [BigInt(id)],
    chainId,
  }) as { data: [bigint, string, string, string, string] };

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

        <meta
          property="og:image"
          content={`${
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000"
              : "https://www.chonks.xyz"
          }/api/og-trait?id=${id}`}
        />

        <meta property="og:type" content="website" />
        <meta property="twitter:card" content="summary_large_image" />

        <meta name="robots" content="index, follow" />

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
          }/api/og-trait?id=${id}`}
        />
        <meta property="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Chonksxyz" />

        <meta property="og:type" content="website" />
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
              <div className="hidden sm:block sm:pt-[0.69vw] sm:px-[3.45vw] mt-2">
                <Link
                  href="/market/traits"
                  className="text-sm hover:underline inline-flex items-center"
                >
                  <IoArrowBackOutline className="mr-2" /> View All Listed Traits
                </Link>
              </div>

              <div className="hidden sm:flex sm:flex-row sm:gap-[3.45vw] sm:py-[1.725vw] sm:px-[3.45vw]">
                <div className="w-2/5 h-fit">
                  <ChonkRenderer
                    bytes={traitMetadata.colorMap.slice(2)}
                    bodyIndex={1}
                    opacity={0.6}
                  />
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
                  <ActivitySection tokenId={id} address={address} />
                </div>
              </div>

              <div className="flex flex-col sm:hidden">
                <h1 className="text-[22px] mt-3 font-bold text-center px-4">
                  {traitMetadata?.traitName ? `${traitMetadata.traitName}` : ""}
                </h1>

                <div className="w-full h-auto p-4">
                  <ChonkRenderer
                    bytes={traitMetadata.colorMap.slice(2)}
                    bodyIndex={1}
                    opacity={0.6}
                  />
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

                <ActivitySection tokenId={id} address={address} />
              </div>
            </>
          ) : (
            <Loading />
          )}
        </main>
        <Footer />
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
