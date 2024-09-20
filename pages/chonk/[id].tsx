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
import EquipmentContainer from "@/pages/components/chonk_explorer/EquipmentContainer";
import { Category } from "@/types/Category";
import MenuBar from "@/pages/components/chonk_explorer/MenuBar";
import MainChonkImage from "@/pages/components/chonk_explorer/MainChonkImage";
import OwnershipSection from "@/pages/components/chonk_explorer/OwnershipSection";
import Trait from "@/pages/components/chonk_explorer/Trait";

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

  // useEffect(() => {
  //   if (storedPeter) {
  //     console.log("storedPeter:", storedPeter);
  //   }
  // else {
  //   console.log("error getting storedPeter data");
  // }
  // }, [storedPeter]);

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
      <MenuBar />

      {/* Might need to move this width above the MenuBar */}
      <div className="w-[1280px] mx-auto ">
        {tokenData ? (
          <div>
            <div className="flex flex-row justify-center gap-4 ">
              <MainChonkImage id={id} tokenData={tokenData} />
            </div>

            <OwnershipSection
              id={id}
              tokenData={tokenData}
              owner={owner}
              address={address}
            />

            <div className="flex flex-col mt-12">
              <div>
                <p className="text-2xl font-bold pb-2 ml-12">
                  Your Chonk Is Wearing
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
