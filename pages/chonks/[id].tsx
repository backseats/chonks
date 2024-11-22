import { useState, useEffect, useMemo } from "react";
import { baseSepolia } from "viem/chains";
import { useReadContract, useWalletClient, useAccount } from "wagmi";
import { getAddress } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import { Chonk } from "@/types/Chonk";
import {
  mainABI,
  mainContract,
  traitsContract,
  tokenURIABI,
  traitsABI,
} from "@/contract_data";
import { StoredChonk } from "@/types/StoredChonk";
import EquipmentContainer from "@/components/chonk_explorer/EquipmentContainer";
import { Category } from "@/types/Category";
import MenuBar from "@/components/chonk_explorer/MenuBar";
import MainChonkImage from "@/components/chonk_explorer/MainChonkImage";
import OwnershipSection from "@/components/chonk_explorer/OwnershipSection";
import Trait from "@/components/chonk_explorer/Trait";

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

  // console.log(jsonData);

  setData(jsonData);
}

export default function ChonkDetail({ id }: { id: string }) {
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

  // const { data } = writeContract({
  //   address: mainContract,
  //   abi: abi,
  //   functionName: "mint",
  //   args: [],
  //   chainId: baseSepolia.id,
  // });

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
    chainId: baseSepolia.id,
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
      hat: {
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
      glasses: {
        tokenId:
          storedChonk.faceId === 0n
            ? 0
            : parseInt(storedChonk.faceId.toString()),
        category: Category.Face,
        isEquipped: storedChonk.faceId !== 0n,
      },
      handheld: {
        tokenId:
          storedChonk.accessoryId === 0n
            ? 0
            : parseInt(storedChonk.accessoryId.toString()),
        category: Category.Accessory,
        isEquipped: storedChonk.accessoryId !== 0n,
      },
      shirt: {
        tokenId:
          storedChonk.topId === 0n ? 0 : parseInt(storedChonk.topId.toString()),
        category: Category.Top,
        isEquipped: storedChonk.topId !== 0n,
      },
      pants: {
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
    });
  }, [storedChonk]);

  useEffect(() => {
    console.log("currentChonk", currentChonk);
  }, [currentChonk]);

  const tbaAddress = tokenboundClient.getAccount({
    tokenContract: mainContract,
    tokenId: id.toString(),
  });

  if (address) {
    console.log("address is", address);
    console.log("tba address is", tbaAddress);
  }

  // Get all the traits that the TBA owns, equipped or not (ex  [1n, 2n, 3n, 4n, 5n])
  const { data: allTraitTokenIds } = useReadContract({
    address: traitsContract,
    abi: traitsABI,
    functionName: "walletOfOwner",
    args: [tbaAddress],
    chainId: baseSepolia.id,
  }) as { data: BigInt[] };

  console.log("allTraitTokenIds", allTraitTokenIds); // this is good, works

  // This gets the ids that are equipped to the chonk
  useEffect(() => {
    if (!storedChonk) return;

    console.log("storedChonk", storedChonk);

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
      storedChonk.faceId === 0n
        ? null
        : allTraitTokenIds.findIndex(
            (tokenId) => tokenId === storedChonk.faceId
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

  return (
    <>
      <MenuBar />

      {/* Might need to move this width above the MenuBar */}
      <div className="w-[1280px] mx-auto ">
        {tokenData ? (
          <div>
            <MainChonkImage id={id} tokenData={tokenData} />

            <OwnershipSection
              id={id}
              tokenData={tokenData}
              owner={owner}
              address={address}
              tbaAddress={tbaAddress}
              isYours={isOwner}
            />

            {/* Equipped Attributes Grids */}
            <div className="flex flex-col mt-12">
              <div>
                <p className="text-2xl font-bold pb-2 ml-12">
                  {isOwner ? "Your" : "This"} Chonk Is Wearing
                </p>

                <div className="flex flex-row mt-2 gap-4 justify-center">
                  {currentChonk &&
                    Object.keys(currentChonk).map((key, index) => {
                      if (
                        key === "epoch" ||
                        key === "seed" ||
                        key === "isRevealed" ||
                        key === "bodyIndex" ||
                        key === "tokenId"
                      )
                        return null;

                      const stored = currentChonk;

                      // @ts-ignore
                      if (stored[key].tokenId == 0) return null;

                      // console.log(stored[key].toString());

                      return (
                        <div key={index}>
                          <Trait
                            chonkId={id}
                            // @ts-ignore
                            traitTokenId={stored[key].tokenId.toString()}
                            isEquipped={true}
                            selectedCategory={"All"}
                            isYours={isOwner}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>

              <div>
                <p className="text-2xl font-bold mt-12 ml-12">In Your Pack</p>

                <div className="flex justify-center mt-8">
                  {filteredTraitTokenIds && (
                    <EquipmentContainer
                      chonkId={id.toString()}
                      traitTokenIds={filteredTraitTokenIds}
                      isYours={isOwner}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
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
