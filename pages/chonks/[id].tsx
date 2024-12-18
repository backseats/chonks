import { useState, useEffect, useMemo } from "react";
import { useReadContract, useWalletClient, useAccount } from "wagmi";
import { getAddress } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import { Chonk } from "@/types/Chonk";
import { CurrentChonk } from "@/types/CurrentChonk";
import {
  mainABI,
  mainContract,
  traitsContract,
  traitsABI,
  chainId
} from "@/contract_data";
import { StoredChonk } from "@/types/StoredChonk";
import EquipmentContainer from "@/components/chonk_explorer/EquipmentContainer";
import { Category } from "@/types/Category";
import MenuBar from "@/components/chonk_explorer/MenuBar";
import MainChonkImage from "@/components/chonk_explorer/MainChonkImage";
import OwnershipSection from "@/components/chonk_explorer/OwnershipSection";
import Trait from "@/components/chonk_explorer/Trait";
import { useTraitRevealStatus } from "@/hooks/useTraitRevealStatus";
import BodySwitcher from "../../components/chonk_explorer/BodySwitcher";
import { decodeAndSetData } from "@/lib/decodeAndSetData";
import EquippedAttributes from "@/components/chonk_explorer/EquippedAttributes";
import RendererSwitcher from "@/components/chonk_explorer/RendererSwitcher";
import BGColorSwitcher from "@/components/chonk_explorer/BGColorSwitcher";
import Head from "next/head";
import { useBasePaintOwnership } from "@/hooks/useBasepaintOwnership";
import { useSongDaymannOwnership, useFarWestOwnership } from "@/hooks/useSingADayMannOwnership";
import Image from "next/image";
import Link from "next/link";

export default function ChonkDetail({ id }: { id: string }) {

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

  // const { isRevealed } = useTraitRevealStatus(BigInt(id));
  // console.log("isRevealed", isRevealed);

  // const { data } = writeContract({
  //   address: mainContract,
  //   abi: abi,
  //   functionName: "mint",
  //   args: [],
  //   chainId,
  // });

  // Get main body tokenURI
  const { data: tokenURIData } = useReadContract({
    address: mainContract,
    abi: mainABI,
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

  const isOwner = useMemo(() => {
    if (!owner || !address) return false;
    return getAddress(owner) === getAddress(address);
  }, [owner, address]);

  useEffect(() => {
    if (tokenURIData) {
      decodeAndSetData(tokenURIData, setTokenData);
    }
    // else {
    //   console.log("No tokenURI data");
    // }
  }, [tokenURIData]);

  // Get the trait ids that are equipped to the body
  const { data: storedChonk } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: "getChonk",
    args: [BigInt(id)],
    chainId,
  }) as { data: StoredChonk };

  // useEffect(() => {
  //   if (storedChonk) {
  //     console.log("storedChonk:", storedChonk);
  //   }
  // else {
  //   console.log("error getting storedChonk data");
  // }
  // }, [storedChonk]);

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
      render3D: storedChonk.render3D
    });
  }, [storedChonk]);

  useEffect(() => {
    console.log("currentChonk", currentChonk);
  }, [currentChonk]);

  const tbaAddress = tokenboundClient.getAccount({
    tokenContract: mainContract,
    tokenId: id.toString(),
  });

  const basePaintOwnership = useBasePaintOwnership(tbaAddress);
  const songDaymannOwnership = useSongDaymannOwnership(tbaAddress);
  const farWestOwnership = useFarWestOwnership(tbaAddress); // TODO: generalize this

  // Get all the traits that the TBA owns, equipped or not (ex  [1n, 2n, 3n, 4n, 5n])
  const { data: allTraitTokenIds } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "walletOfOwner",
    args: [tbaAddress],
    chainId,
  }) as { data: BigInt[] };

  // console.log("allTraitTokenIds", allTraitTokenIds); // this is good, works

  // This gets the ids that are equipped to the chonk
  useEffect(() => {
    if (!storedChonk) return;

    // console.log("storedChonk", storedChonk);
    // console.log("allTraitTokenIds", allTraitTokenIds);

    // need to check if the trait is revealed

    const headIdIndex =
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

    const faceIdIndex =
      // @ts-ignore
      storedChonk.faceId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (tokenId) => tokenId === storedChonk.faceId
          );

    const accessoryIdIndex =
      // @ts-ignore
      storedChonk.accessoryId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (tokenId) => tokenId === storedChonk.accessoryId
          );

    const topIdIndex =
      // @ts-ignore
      storedChonk.topId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (tokenId) => tokenId === storedChonk.topId
          );

    const bottomIdIndex =
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
        index !== headIdIndex &&
        index !== hairIdIndex &&
        index !== faceIdIndex &&
        index !== accessoryIdIndex &&
        index !== topIdIndex &&
        index !== bottomIdIndex &&
        index !== shoesIdIndex
      );
    });

    // [] means everything is equipped
    console.log("filteredTraitTokenIds", filteredTraitTokenIds);

    setFilteredTraitTokenIds(filteredTraitTokenIds);
  }, [allTraitTokenIds, storedChonk]);

  return (
    <>

        <Head>
            <title>Chonk #{id} Explorer </title>
            <meta name="description" content={`Chonk #${id} Explorer - Chonks`} />
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

        <div className="w-full mx-auto ">
          {tokenData ? (
            <div>
              <OwnershipSection
                id={id}
                tokenData={tokenData}
                owner={owner}
                address={address}
                tbaAddress={tbaAddress}
                isYours={isOwner}
              />

              <div className="flex flex-col items-center">
              <MainChonkImage
                id={id}
                tokenData={tokenData}
              />

              { isOwner && <RendererSwitcher
                chonkId={id}
                is3D={currentChonk?.render3D ?? false}
              /> }
              </div>

              {/* Equipped Attributes Grids */}
              <div className="flex flex-col mt-12">
                <div>
                  <div className="text-2xl font-bold mt-12 w-full text-center">{isOwner ? "Your" : "This"} Chonk Is Wearing</div>

                  <div className="flex flex-wrap mt-8 gap-4 justify-center w-full text-center">
                    {currentChonk &&
                      Object.keys(currentChonk).map((key, index) => {
                        if (
                          key === "epoch" ||
                          key === "seed" ||
                          key === "isRevealed" ||
                          key === "bodyIndex" ||
                          key === "tokenId" ||
                          key === "backgroundColor" ||
                          key === "render3D"
                        )
                          return null;

                        const stored = currentChonk;

                        // console.log("stored", stored);

                        // @ts-ignore
                        if (stored[key]?.tokenId == 0) return null;
                        // Type assertion to handle indexing
                        // const traitData = stored[key as keyof typeof stored];
                        // console.log("traitData", traitData);

                        return (
                          <div key={index}>
                            <Trait
                              chonkId={id}
                              // @ts-ignore
                              traitTokenId={stored[key].tokenId.toString()}
                              isEquipped={true}
                              selectedCategory={"All"}
                              isYours={isOwner}
                              tbaAddress={tbaAddress}
                              tokenboundClient={tokenboundClient}
                              address={address}
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="flex flex-col mt-12">
                  <div className="text-2xl font-bold mt-12 w-full text-center">Additional Traits In {isOwner ? "Your" : "Their"} Backpack</div>
                  <div className="flex flex-wrap mt-8 gap-4 justify-center w-full text-center">
                    {filteredTraitTokenIds && (
                      <EquipmentContainer
                        chonkId={id.toString()}
                        traitTokenIds={filteredTraitTokenIds}
                        isYours={isOwner}
                        tokenboundClient={tokenboundClient}
                        tbaAddress={tbaAddress}
                      />
                    )}
                  </div>
                </div>

                {isOwner && (
                  <>
                    <div className="flex flex-col mt-12">
                      <div className="text-2xl font-bold mt-12 w-full text-center">Your Chonk&apos;s Skin Tone</div>

                      <div className="flex flex-wrap mt-8 gap-4 justify-center w-full text-center">
                          <BodySwitcher
                            chonkId={id}
                            yourBodyIndex={currentChonk?.bodyIndex ?? 0}
                          />
                      </div>

                    </div>

                    <div>
                      <p className="flex flex-col mt-12">
                        <div className="text-2xl font-bold mt-12 w-full text-center">Set Background Color</div>
                        <div className="flex flex-wrap gap-4 justify-center w-full text-center">
                          <BGColorSwitcher
                            id={id}
                            bodyIndex={currentChonk?.bodyIndex ?? 0}
                            backgroundColor={currentChonk?.backgroundColor ?? "#48A6FA"}
                          />
                        </div>
                      </p>
                    </div>
                  </>
                )}

                { (basePaintOwnership || songDaymannOwnership) && <div className="flex flex-col mt-6">
                  <div className="text-2xl font-bold mt-12 w-full text-center my-6">Backpack Collectibles</div>

                    <div className="flex flex-row gap-4 justify-center items-center my-6">
                      { basePaintOwnership && (
                        <Link href="https://basepaint.xyz/canvas/485" target="_blank" rel="noopener noreferrer">
                          <Image src="/basepaint485.png" alt="Base Paint" width={300} height={300} />
                        </Link>
                      )}

                      { songDaymannOwnership && (
                        <Link href="https://opensea.io/assets/base/0xb3bad5fe12268edc8a52ff786076c1d1fa92ef0d/2" target="_blank" rel="noopener noreferrer">
                          <Image src="/mannsong.png" alt="Song Daymann" width={300} height={300} />
                        </Link>
                      )}

                      { farWestOwnership && (
                        <Link href="https://opensea.io/assets/base/0x0000000080d04343d60d06e1a36aaf46c9242805/2002501" target="_blank" rel="noopener noreferrer">
                          <Image src="/fw2501.png" alt="Far West" width={300} height={300} />
                        </Link>
                      )}
                    </div>
                  </div>
                }

              </div>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
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
