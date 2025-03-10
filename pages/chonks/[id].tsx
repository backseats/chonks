import { useState, useEffect, useMemo } from "react";
import {
  useReadContract,
  useWalletClient,
  useAccount,
  useWriteContract,
} from "wagmi";
import { getAddress, isAddress } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import { Chonk } from "@/types/Chonk";
import { CurrentChonk } from "@/types/CurrentChonk";
import {
  mainABI,
  mainContract,
  traitsContract,
  traitsABI,
  chainId,
  renderAsDataUriABI,
} from "@/contract_data";
import { StoredChonk } from "@/types/StoredChonk";
import EquipmentContainer from "@/components/chonk_explorer/EquipmentContainer";
import { Category } from "@/types/Category";
import MenuBar from "@/components/chonk_explorer/MenuBar";
import MainChonkImage from "@/components/chonk_explorer/MainChonkImage";
import OwnershipSection from "@/components/chonk_explorer/OwnershipSection";
import Trait from "@/components/chonk_explorer/Trait";
import { useTraitRevealStatus } from "@/hooks/useTraitRevealStatus";
import BodySwitcher from "@/components/chonk_explorer/BodySwitcher";
import { decodeAndSetData } from "@/lib/decodeAndSetData";
import BGColorSwitcher from "@/components/chonk_explorer/BGColorSwitcher";
import Head from "next/head";
import {
  useBasePaintOwnership485,
  useBasePaintOwnership577,
} from "@/hooks/useBasepaintOwnership";
import {
  useSongDaymannOwnership,
  useFarWestOwnership,
  useOneBitChonksOwnership,
  useRetroChonksOwnership,
  useClassOfTwentyFour,
} from "@/hooks/useSongADayMannOwnership";
import Image from "next/image";
import Link from "next/link";
import { SendHorizontal } from "lucide-react";

export default function ChonkDetail({ id }: { id: string }) {
  const TOKEN_URI = "tokenURI";

  const { address } = useAccount();

  const { data: walletClient } = useWalletClient();
  const tokenboundClient = new TokenboundClient({
    walletClient,
    chainId,
  });

  const [tokenData, setTokenData] = useState<Chonk | null>(null);

  const [renderData2D, setRenderData2D] = useState<Chonk | null>(null);
  const [renderData3D, setRenderData3D] = useState<Chonk | null>(null);

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

  const { data: render2dData } = useReadContract({
    address: mainContract,
    abi: renderAsDataUriABI,
    functionName: "renderAsDataUri2D",
    args: [BigInt(id)],
    chainId,
  }) as { data: string };

  const { data: render3dData } = useReadContract({
    address: mainContract,
    abi: renderAsDataUriABI,
    functionName: "renderAsDataUri3D",
    args: [BigInt(id)],
    chainId,
  }) as { data: string };

  useEffect(() => {
    if (tokenURIData) {
      decodeAndSetData(tokenURIData, setTokenData);
    }
  }, [tokenURIData]);

  useEffect(() => {
    if (render2dData) decodeAndSetData(render2dData, setRenderData2D);
  }, [render2dData]);

  useEffect(() => {
    if (render3dData) decodeAndSetData(render3dData, setRenderData3D);
  }, [render3dData]);

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
      render3D: storedChonk.render3D,
    });
  }, [storedChonk]);

  useEffect(() => {
    console.log("currentChonk", currentChonk);
  }, [currentChonk]);

  const tbaAddress = tokenboundClient.getAccount({
    tokenContract: mainContract,
    tokenId: id.toString(),
  });

  const basePaintOwnership485 = useBasePaintOwnership485(tbaAddress);
  const basePaintOwnership577 = useBasePaintOwnership577(tbaAddress);
  const songDaymannOwnership = useSongDaymannOwnership(tbaAddress);
  const farWestOwnership = useFarWestOwnership(tbaAddress); // TODO: generalize this
  const oneBitChonksOwnership = useOneBitChonksOwnership(tbaAddress);
  const classOfTwentyFourOwnership = useClassOfTwentyFour(tbaAddress);
  const retroChonksOwnership = useRetroChonksOwnership(tbaAddress);

  // Get all the traits that the TBA owns, equipped or not (ex  [1n, 2n, 3n, 4n, 5n])
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
    if (!allTraitTokenIds) return;

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

  const [showSendModal, setShowSendModal] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);

  const {
    writeContract,
    data: hash,
    isSuccess,
    isPending,
    reset,
  } = useWriteContract();

  useEffect(() => {
    if (hash) {
      setTxHash(hash);
    }
  }, [hash]);

  useEffect(() => {
    if (isSuccess) {
      // Auto close modal after success
      setTimeout(() => {
        setShowSendModal(false);
        setRecipientAddress("");
        setAddressError("");
        setTxHash(null);
        reset();
      }, 3000);
    }
  }, [isSuccess]);

  const handleSendChonk = async () => {
    if (!isAddress(recipientAddress)) {
      setAddressError("Please enter a valid Ethereum address");
      return;
    }

    try {
      await writeContract({
        address: mainContract,
        abi: mainABI,
        functionName: "transferFrom",
        args: [address, recipientAddress, BigInt(id)],
      });
    } catch (error) {
      console.error("Error sending Chonk:", error);
    }
  };

  return (
    <>
      <Head>
        <title>{`Chonk #${id} Explorer`}</title>
        <meta name="description" content={`Chonk #${id} Explorer - Chonks`} />
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

      <div className="min-h-screen w-full text-black font-source-code-pro font-weight-600 text-[3vw] sm:text-[1.5vw] pb-12 sm:pb-6">
        <MenuBar />

        <div className="w-full mx-auto ">
          <div className="flex flex-col items-end">
            {isOwner && (
              <button
                onClick={() => setShowSendModal(true)}
                className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 mr-4 mt-4 text-sm border-2 border-black"
              >
                <SendHorizontal size={24} />
              </button>
            )}
          </div>

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

              <MainChonkImage
                chonkId={id}
                render2dData={renderData2D}
                render3dData={renderData3D}
                is3D={currentChonk?.render3D ?? false}
                isOwner={isOwner}
                currentChonkBodyIndex={
                  isOwner ? currentChonk?.bodyIndex ?? 0 : null
                }
              />

              {/* Equipped Attributes Grids */}
              <div className="flex flex-col mt-12">
                <div>
                  <div className="text-2xl font-bold mt-12 w-full text-center">
                    {isOwner ? "Your" : "This"} Chonk Is Wearing
                  </div>

                  {/* Updated grid layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8 px-4 sm:px-8 max-w-[1400px] mx-auto">
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

                        // @ts-ignore
                        if (stored[key]?.tokenId == 0) return null;

                        return (
                          <div key={index} className="aspect-square w-full">
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
                  <div className="text-2xl font-bold mt-12 mb-8 w-full text-center">
                    Additional Traits In {isOwner ? "Your" : "Their"} Backpack
                  </div>
                  <div className="max-w-[1400px] mx-auto w-full">
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
                  <div className="flex flex-col mt-12">
                    <div className="text-2xl font-bold mt-12 w-full text-center">
                      Set Background Color
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center w-full text-center">
                      <BGColorSwitcher
                        id={id}
                        backgroundColor={
                          currentChonk?.backgroundColor ?? "#48A6FA"
                        }
                        render2dData={renderData2D}
                      />
                    </div>
                  </div>
                )}

                {(basePaintOwnership485 ||
                  basePaintOwnership577 ||
                  songDaymannOwnership ||
                  farWestOwnership ||
                  oneBitChonksOwnership.hasAssets ||
                  retroChonksOwnership.hasAssets ||
                  classOfTwentyFourOwnership.hasAssets) && (
                  <div className="flex flex-col mt-6">
                    <div className="text-2xl font-bold mt-12 w-full text-center my-6">
                      Backpack Collectibles
                    </div>

                    <div className="flex flex-row gap-4 justify-center items-center my-6">
                      {basePaintOwnership485 && (
                        <Link
                          href="https://basepaint.xyz/canvas/485"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Image
                            src="/basepaint485.png"
                            alt="BasePaint #485"
                            width={300}
                            height={300}
                          />
                        </Link>
                      )}

                      {basePaintOwnership577 && (
                        <Link
                          href="https://basepaint.xyz/canvas/577"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Image
                            src="/basepaint577.png"
                            alt="BasePaint #577"
                            width={300}
                            height={300}
                          />
                        </Link>
                      )}

                      {songDaymannOwnership && (
                        <Link
                          href="https://opensea.io/assets/base/0xb3bad5fe12268edc8a52ff786076c1d1fa92ef0d/2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Image
                            src="/mannsong.png"
                            alt="Song Daymann"
                            width={300}
                            height={300}
                          />
                        </Link>
                      )}

                      {farWestOwnership && (
                        <Link
                          href="https://opensea.io/assets/base/0x0000000080d04343d60d06e1a36aaf46c9242805/2002501"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Image
                            src="/fw2501.png"
                            alt="Far West"
                            width={300}
                            height={300}
                          />
                        </Link>
                      )}

                      {oneBitChonksOwnership.hasAssets &&
                        oneBitChonksOwnership.assets.map((asset: any) => (
                          <Link
                            key={asset.id}
                            href={`https://opensea.io/assets/base/0x22ca771878c9bd8c594969e871d01267553eeac2/${asset.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <div className="flex flex-col items-center">
                              <Image
                                src={asset.imageUrl}
                                alt={`One Bit Chonks #${asset.id}`}
                                width={300}
                                height={300}
                              />
                              {/* <div className="mt-2 text-lg font-medium">
                                One Bit Chonk #{asset.id}
                              </div> */}
                            </div>
                          </Link>
                        ))}

                      {retroChonksOwnership.hasAssets &&
                        retroChonksOwnership.assets.map((asset: any) => (
                          <Link
                            key={asset.id}
                            href={`https://opensea.io/assets/base/0x27af311ad4b2955a4692774573d6d04ca66aa016/${asset.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <div className="flex flex-col items-center">
                              <Image
                                src={asset.imageUrl}
                                alt={`Retro Chonks #${asset.id}`}
                                width={300}
                                height={300}
                              />
                              {/* <div className="mt-2 text-lg font-medium">
                                Retro Chonk #{asset.id}
                              </div> */}
                            </div>
                          </Link>
                        ))}

                      {classOfTwentyFourOwnership.hasAssets &&
                        classOfTwentyFourOwnership.assets.map((asset: any) => (
                          <Link
                            key={asset.id}
                            href={`https://opensea.io/assets/base/0xc3a9812cb19fb2495a88f77a09b2f1099276e87e/${asset.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Image
                              src={asset.imageUrl}
                              alt={`Class of 2024 #${asset.id}`}
                              width={300}
                              height={300}
                            />
                          </Link>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-screen flex items-center justify-center">
              <p>Loading the Chonkiness</p>
            </div>
          )}
        </div>
      </div>

      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-md">
            <h2 className="text-xl font-bold mb-4 text-center">
              {isSuccess
                ? "Transfer Was Successful"
                : isPending
                ? "Confirm the Transfer with your Wallet"
                : `Transfer Chonk #${id}`}
            </h2>

            {!isSuccess && !isPending && (
              <input
                type="text"
                placeholder="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
                value={recipientAddress}
                onChange={(e) => {
                  setRecipientAddress(e.target.value);
                  setAddressError("");
                }}
                className="w-full p-2 border-2 border-black rounded mb-2 text-sm"
              />
            )}

            {!isSuccess && !isPending && addressError && (
              <div className="text-red-500 text-sm pb-2">{addressError}</div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              {!isSuccess && !isPending && (
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setRecipientAddress("");
                    setAddressError("");
                    setTxHash(null);
                  }}
                  className="px-4 py-2 border-2 border-black rounded"
                >
                  Cancel
                </button>
              )}

              {isPending && txHash ? (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 pt-[10px] bg-black text-white rounded hover:bg-gray-800"
                >
                  View transaction
                </a>
              ) : (
                !isPending &&
                !isSuccess && (
                  <button
                    onClick={handleSendChonk}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                  >
                    Send Chonk
                  </button>
                )
              )}

              {isSuccess && (
                <div className="text-green-600 text-center w-full">
                  Closing in a moment
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
