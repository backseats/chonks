import { useState, useEffect, useMemo, useCallback } from "react";
import {
  useReadContract,
  useWalletClient,
  useAccount,
  useWriteContract,
  useEnsAddress,
} from "wagmi";
import { Address, getAddress, isAddress, parseEther } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import { Chonk } from "@/types/Chonk";
import { CurrentChonk } from "@/types/CurrentChonk";
import {
  mainABI,
  mainContract,
  chainId,
  marketplaceContract,
  marketplaceABI,
} from "@/config";
import { mainnet } from "viem/chains";
import { StoredChonk } from "@/types/StoredChonk";
import UnequippedTraits from "@/components/chonk_explorer/UnequippedTraits";
import { Category } from "@/types/Category";
import MenuBar from "@/components/MenuBar";
import MainChonkImage from "@/components/chonk_explorer/MainChonkImage";
import OwnershipSection from "@/components/chonk_explorer/OwnershipSection";
import Trait from "@/components/chonk_explorer/Trait";
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
  useLiquidCulturePodcastOwnership,
} from "@/hooks/useSongADayMannOwnership";
import Image from "next/image";
import Link from "next/link";
import { SendHorizontal } from "lucide-react";
import { ModalWrapper } from "@/components/marketplace/chonks/modals/ModalWrapper";
import { ListingModal } from "@/components/marketplace/chonks/modals/ListingModal";
import useListChonk from "@/hooks/marketplace/chonks/useGetChonkListing";
import useCancelOffer from "@/hooks/marketplace/chonks/useCancelOffer";
import client from "@/lib/apollo-client";
import { GET_TRAITS_FOR_CHONK_ID } from "@/lib/graphql/queries";
import TransactionButton from "@/components/TransactionButton";

export type TraitInfo = {
  colorMap: string;
  id: string;
  traitName: string;
  traitType: number;
};

export default function ChonkDetail({ id }: { id: string }) {
  const { address } = useAccount();

  const { data: walletClient } = useWalletClient();
  const tokenboundClient = new TokenboundClient({
    walletClient,
    chainId,
  });

  const [tokenData, setTokenData] = useState<Chonk | null>(null);

  const [renderData2D, setRenderData2D] = useState<Chonk | null>(null);
  const [renderData3D, setRenderData3D] = useState<Chonk | null>(null);

  const [filteredTraitInfo, setFilteredTraitInfo] = useState<TraitInfo[]>([]);
  const [equippedTraitInfo, setEquippedTraitInfo] = useState<TraitInfo[]>([]);
  const [currentChonk, setCurrentChonk] = useState<CurrentChonk | null>(null);
  const [allTraitTokenIds, setAllTraitTokenIds] = useState<TraitInfo[]>([]);

  // Local Marketplace Listing States
  const [showListModal, setShowListModal] = useState(false);
  const [localListingPending, setLocalListingPending] = useState(false);
  const [
    chonkPrivateListingRecipientAddress,
    setChonkPrivateListingRecipientAddress,
  ] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [isPrivateListingExpanded, setIsPrivateListingExpanded] =
    useState(false);
  const [chonkListingAddressError, setChonkListingAddressError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [localCancelOfferChonkSuccess, setLocalCancelOfferChonkSuccess] =
    useState(false);

  const [isEquipPending, setIsEquipPending] = useState(false);

  // Get main body tokenURI
  const {
    data: tokenURIData,
    error: tokenURIError,
    refetch: refetchTokenURI,
  } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: "tokenURI",
    args: [BigInt(id)],
    chainId,
  }) as { data: string; error: Error; refetch: () => void };

  useEffect(() => {
    if (tokenURIError) {
      console.error("Error fetching tokenURI:", tokenURIError);
    }
  }, [tokenURIError]);

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

  const { data: render2dData, refetch: refetchRender2D } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: "renderAsDataUri2D",
    args: [BigInt(id)],
    chainId,
  }) as { data: string; refetch: () => void };

  const { data: render3dData, refetch: refetchRender3D } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: "renderAsDataUri3D",
    args: [BigInt(id)],
    chainId,
  }) as { data: string; refetch: () => void };

  useEffect(() => {
    refetchTokenURI();
    refetchStoredChonk();
    refetchRender2D();
    refetchRender3D();
  }, [isEquipPending]);

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
  const { data: storedChonk, refetch: refetchStoredChonk } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: "getChonk",
    args: [BigInt(id)],
    chainId,
  }) as { data: StoredChonk; refetch: () => void };

  const { hasActiveOffer, refetchChonkOffer } = useListChonk(
    address,
    Number(id)
  );

  const {
    handleCancelOfferChonk,
    isCancelOfferChonkPending,
    isCancelOfferChonkSuccess,
    cancelOfferChonkHash,
  } = useCancelOffer(address, Number(id));

  const handleModalClose = () => {
    setShowListModal(false);
    setListingPrice("");
    setChonkPrivateListingRecipientAddress("");
    setPriceError("");
    setChonkListingAddressError("");
    setLocalListingPending(false);
    setIsPrivateListingExpanded(false);
  };

  const OFFER_PRICE_DECIMAL_PRECISION = 4;
  const MIN_LISTING_PRICE = `0.${"0".repeat(
    OFFER_PRICE_DECIMAL_PRECISION - 1
  )}1`;

  const { data: ensAddress } = useEnsAddress({
    name: chonkPrivateListingRecipientAddress.endsWith(".eth")
      ? chonkPrivateListingRecipientAddress.toLowerCase()
      : "",
    chainId: mainnet.id,
  });

  const isValidAddress = useMemo(() => {
    if (!chonkPrivateListingRecipientAddress) return false;
    if (chonkPrivateListingRecipientAddress.endsWith(".eth"))
      return !!ensAddress;
    return isAddress(chonkPrivateListingRecipientAddress);
  }, [chonkPrivateListingRecipientAddress, ensAddress]);

  const resolvedAddress = useMemo(() => {
    if (chonkPrivateListingRecipientAddress.endsWith(".eth")) return ensAddress;
    return isValidAddress ? chonkPrivateListingRecipientAddress : "";
  }, [chonkPrivateListingRecipientAddress, ensAddress, isValidAddress]);

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

  useEffect(() => {
    if (isCancelOfferChonkSuccess) {
      setLocalCancelOfferChonkSuccess(true);
      setTimeout(() => refetchChonkOffer(), 3000);
    }
  }, [isCancelOfferChonkSuccess]);

  const tbaAddress = tokenboundClient.getAccount({
    tokenContract: mainContract,
    tokenId: id.toString(),
    chainId, // NOTE: This always needs to be on Base because this is where the TBA address is derived from
  });

  const basePaintOwnership485 = useBasePaintOwnership485(tbaAddress);
  const basePaintOwnership577 = useBasePaintOwnership577(tbaAddress);
  const songDaymannOwnership = useSongDaymannOwnership(tbaAddress);
  const farWestOwnership = useFarWestOwnership(tbaAddress); // TODO: generalize this
  const oneBitChonksOwnership = useOneBitChonksOwnership(tbaAddress);
  const classOfTwentyFourOwnership = useClassOfTwentyFour(tbaAddress);
  const retroChonksOwnership = useRetroChonksOwnership(tbaAddress);
  const liquidCulturePodcastOwnership =
    useLiquidCulturePodcastOwnership(tbaAddress);

  useEffect(() => {
    const fetchTraitsForChonkId = async () => {
      const response = await client.query({
        query: GET_TRAITS_FOR_CHONK_ID,
        variables: { id },
      });

      const traits = response.data.chonk.tbas.items[0].traits.items;
      const traitInfo: TraitInfo[] = traits.map(
        (trait: any) => trait.traitInfo
      );

      setAllTraitTokenIds(traitInfo);
    };

    fetchTraitsForChonkId();
  }, []);

  // This gets the ids that are equipped to the chonk
  useEffect(() => {
    if (!storedChonk) return;
    if (!allTraitTokenIds) return;

    const headIdIndex =
      // @ts-ignore
      storedChonk.headId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (traitInfo) => traitInfo.id === storedChonk.headId.toString()
          );

    const hairIdIndex =
      // @ts-ignore
      storedChonk.hairId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (traitInfo) => traitInfo.id === storedChonk.hairId.toString()
          );

    const faceIdIndex =
      // @ts-ignore
      storedChonk.faceId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (traitInfo) => traitInfo.id === storedChonk.faceId.toString()
          );

    const accessoryIdIndex =
      // @ts-ignore
      storedChonk.accessoryId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (traitInfo) => traitInfo.id === storedChonk.accessoryId.toString()
          );

    const topIdIndex =
      // @ts-ignore
      storedChonk.topId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (traitInfo) => traitInfo.id === storedChonk.topId.toString()
          );

    const bottomIdIndex =
      // @ts-ignore
      storedChonk.bottomId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (traitInfo) => traitInfo.id === storedChonk.bottomId.toString()
          );

    const shoesIdIndex =
      // @ts-ignore
      storedChonk.shoesId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (traitInfo) => traitInfo.id === storedChonk.shoesId.toString()
          );

    const filteredTraitTokenIds = allTraitTokenIds
      .map((traitInfo) => BigInt(traitInfo.id))
      .filter((tokenId, index) => {
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

    const filteredTraitInfo = allTraitTokenIds.filter((traitInfo) =>
      filteredTraitTokenIds.includes(BigInt(traitInfo.id))
    );

    const equippedTraitInfo = allTraitTokenIds.filter(
      (traitInfo) => !filteredTraitTokenIds.includes(BigInt(traitInfo.id))
    );

    setEquippedTraitInfo(equippedTraitInfo);
    setFilteredTraitInfo(filteredTraitInfo); // everything else
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
      setAddressError("Please enter a valid address");
      return;
    }

    try {
      await writeContract({
        address: mainContract,
        abi: mainABI,
        functionName: "transferFrom",
        args: [address, recipientAddress, BigInt(id)],
        chainId,
      });
    } catch (error) {
      console.error("Error sending Chonk:", error);
    }
  };

  const validateListing = useCallback(() => {
    let isValid = true;

    setPriceError("");
    setAddressError("");

    const listingPriceNum = Number(listingPrice);
    if (listingPriceNum < Number(MIN_LISTING_PRICE)) {
      setPriceError(`Minimum listing price is ${MIN_LISTING_PRICE} ETH`);
      setListingPrice(MIN_LISTING_PRICE);
      isValid = false;
    }

    if (recipientAddress === "") {
      setAddressError("");
      setIsPrivateListingExpanded(false);
    }

    if (isPrivateListingExpanded) {
      if (resolvedAddress !== "" && !resolvedAddress) {
        setAddressError("Please enter a valid address or ENS name");
        isValid = false;
      }
    }

    if (isValid) setLocalListingPending(true);

    return isValid;
  }, [listingPrice, resolvedAddress, isPrivateListingExpanded]);

  return (
    <>
      <Head>
        <title>{`Chonk #${id} Explorer`}</title>
        <meta name="description" content={`Chonk #${id} Explorer | Chonks`} />

        <meta
          property="og:image"
          content={`${
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000"
              : "https://www.chonks.xyz"
          }/api/og?id=${id}`}
        />
        <meta property="og:title" content={`Chonk #${id}`} />
        <meta
          property="og:url"
          content={`https://www.chonks.xyz/chonks/${id}`}
        />
        <meta
          property="og:description"
          content={`View Chonk #${id} on Chonks.xyz`}
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

        <meta name="robots" content="index, follow" />

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

        <div className="w-full mx-auto border-t">
          {isOwner && (
            <div className="hidden sm:block">
              <ChonkControls
                id={id}
                hasActiveOffer={hasActiveOffer}
                isListChonkPending={localListingPending}
                setShowListModal={setShowListModal}
                setShowSendModal={setShowSendModal}
                refetchChonkOffer={refetchChonkOffer}
              />
            </div>
          )}

          <ModalWrapper
            isOpen={showListModal}
            onClose={handleModalClose}
            localListingPending={localListingPending}
          >
            <ListingModal
              chonkId={Number(id)}
              listingPrice={listingPrice}
              setListingPrice={setListingPrice}
              isPrivateListingExpanded={isPrivateListingExpanded}
              setIsPrivateListingExpanded={setIsPrivateListingExpanded}
              recipientAddress={chonkPrivateListingRecipientAddress}
              setRecipientAddress={setChonkPrivateListingRecipientAddress}
              addressError={addressError}
              priceError={priceError}
              onClose={handleModalClose}
              address={marketplaceContract}
              abi={marketplaceABI}
              args={
                isValidAddress
                  ? [Number(id), parseEther(listingPrice), recipientAddress]
                  : [Number(id), parseEther(listingPrice)]
              }
              functionName={
                isValidAddress ? "offerChonkToAddress" : "offerChonk"
              }
              inFlightLabel={"Listing your Chonk..."}
              onSuccess={() => {
                handleModalClose();
                refetchChonkOffer();
              }}
              validateListing={validateListing}
            />
          </ModalWrapper>

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

              {isOwner && (
                <div className="sm:hidden w-full mx-auto">
                  <ChonkControls
                    id={id}
                    hasActiveOffer={hasActiveOffer}
                    isListChonkPending={localListingPending}
                    setShowListModal={setShowListModal}
                    setShowSendModal={setShowSendModal}
                    refetchChonkOffer={refetchChonkOffer}
                  />
                </div>
              )}

              {/* Hide on mobile for now until we fix up the mobile studio */}
              {/* {!isOwner && (
                <span className="sm:hidden flex justify-end px-4">
                  <Link href={`/studio?id=${id}`} className="mt-[16px]">
                    <img
                      src="/studio-no-grid.svg"
                      className="w-[50px] h-[50px]"
                      alt="View in Chonks Studio"
                    />
                  </Link>
                </span>
              )} */}

              {/* Equipped Attributes Grids */}
              <div className="flex flex-col mt-12">
                <div>
                  <div className="text-2xl font-bold mt-12 w-full text-center">
                    {isOwner ? "Your" : "This"} Chonk is Wearing
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8 px-4 sm:px-8 max-w-[1400px] mx-auto">
                    {equippedTraitInfo.map((traitInfo, index) => {
                      return (
                        <div key={index} className="aspect-square w-full">
                          <Trait
                            chonkId={id}
                            // @ts-ignore
                            traitTokenId={traitInfo.id}
                            isEquipped={true}
                            isYours={isOwner}
                            tbaAddress={tbaAddress}
                            tokenboundClient={tokenboundClient}
                            address={address}
                            isEquipPending={isEquipPending}
                            setIsEquipPending={setIsEquipPending}
                            traitInfo={traitInfo}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col mt-12">
                  <div className="text-2xl font-bold mt-12 mb-8 w-full text-center">
                    Additional Traits in {isOwner ? "Your" : "Their"} Backpack
                  </div>
                  <div className="max-w-[1400px] mx-auto w-full">
                    {filteredTraitInfo && (
                      <UnequippedTraits
                        chonkId={id.toString()}
                        traits={filteredTraitInfo}
                        isYours={isOwner}
                        tokenboundClient={tokenboundClient}
                        tbaAddress={tbaAddress}
                        isEquipPending={isEquipPending}
                        setIsEquipPending={setIsEquipPending}
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
                          currentChonk?.backgroundColor ?? "#126E9D"
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
                  liquidCulturePodcastOwnership ||
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
                              <img
                                src={asset.cachedUrl}
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
                                src={asset.cachedUrl}
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

                      {liquidCulturePodcastOwnership && (
                        <Link
                          href="https://opensea.io/assets/base/0xa0e9e8f792c2f15938474cabaca2705d9d8475eb/42"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Image
                            src="/liquidculture.png"
                            alt="Liquid Culture Podcast"
                            width={300}
                            height={300}
                          />
                        </Link>
                      )}
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

const ChonkControls = ({
  id,
  hasActiveOffer,
  isListChonkPending,
  setShowListModal,
  setShowSendModal,
  refetchChonkOffer,
}: {
  id: string;
  hasActiveOffer: boolean;
  isListChonkPending: boolean;
  setShowListModal: (show: boolean) => void;
  setShowSendModal: (show: boolean) => void;
  refetchChonkOffer: () => void;
}) => {
  const [error, setError] = useState<string | null>(null);

  const base =
    "bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 mt-4 text-sm border-2 border-black";

  return (
    <>
      <div className="flex justify-between sm:justify-end flex-row px-4">
        <Link href={`/market/chonks/${id}`} className={`${base} mr-3`}>
          <div className="pt-[2px] text-center">View on Market</div>
        </Link>

        {hasActiveOffer ? (
          <div className="flex flex-col gap-2 max-w-[300px] max-h-[100px]">
            <TransactionButton
              buttonStyle="simple"
              address={marketplaceContract}
              abi={marketplaceABI}
              args={[id]}
              functionName="cancelOfferChonk"
              label="Cancel Listing"
              inFlightLabel="Canceling Listing..."
              setError={setError}
              reset={() => {}}
              onSuccess={() => {
                refetchChonkOffer();
              }}
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
          </div>
        ) : (
          <button
            className={`${base} mr-3 disabled:opacity-50`}
            onClick={() => setShowListModal(true)}
            disabled={isListChonkPending}
          >
            <div className="pt-[2px]">List My Chonk</div>
          </button>
        )}

        <div className="flex flex-row justify-between items-end">
          <button onClick={() => setShowSendModal(true)} className={`${base}`}>
            <div className="hidden sm:block">
              <SendHorizontal size={24} />
            </div>
            <div className="sm:hidden h-[44px] flex items-center justify-center">
              Send
            </div>
          </button>

          <Link href={`/studio?id=${id}`} className="mt-[16px]">
            <div className="hidden sm:block sm:ml-3">
              <img
                src="/studio-no-grid.svg"
                className="w-[43px] h-[44px]"
                alt="View in Chonks Studio"
              />
            </div>
          </Link>
        </div>
      </div>
    </>
  );
};

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
