import Image from "next/image";
import { useEffect, useState } from "react";
import { baseSepolia } from "viem/chains";
import {
  useReadContract,
  useWalletClient,
  useWriteContract,
  useAccount,
} from "wagmi";
import { TokenboundClient } from "@tokenbound/sdk";
import { Chonk } from "@/types/Chonk";
import {
  abi,
  mainContract,
  traitsContract,
  tokenURIABI,
  traitsAbi,
} from "@/contract_data";
import { useRouter } from "next/navigation";
import { Equipment } from "@/types/Equipment";
import EquipmentContainer from "@/pages/components/chonk_explorer/EquipmentContainer";
import EquippedTrait from "@/pages/components/chonk_explorer/EquippedTrait";
import { Category } from "@/types/Category";
import { ConnectKitButton } from "connectkit";
import { Address } from "viem";

const truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;

export const truncateEthAddress = (address: Address | string) => {
  const match = address.match(truncateRegex);
  if (!match) return address;
  return `${match[1]}…${match[2]}`;
};

type CurrentChonk = {
  tokenId: number;
  hat: {
    tokenId: number | null;
    category: Category;
    isEquipped: boolean;
  };
  hair: {
    tokenId: number | null;
    category: Category;
    isEquipped: boolean;
  };
  glasses: {
    tokenId: number | null;
    category: Category;
    isEquipped: boolean;
  };
  handheld: {
    tokenId: number | null;
    category: Category;
    isEquipped: boolean;
  };
  shirt: {
    tokenId: number | null;
    category: Category;
    isEquipped: boolean;
  };
  pants: {
    tokenId: number | null;
    category: Category;
    isEquipped: boolean;
  };
  shoes: {
    tokenId: number | null;
    category: Category;
    isEquipped: boolean;
  };
};

export function decodeAndSetData(data: string, setData: (data: Chonk) => void) {
  const base64String = data.split(",")[1];
  const jsonString = atob(base64String);
  const jsonData = JSON.parse(jsonString) as Chonk;

  setData(jsonData);
}

export default function ChonkDetail({ id }: { id: string }) {
  const TOKEN_URI = "tokenURI";
  const router = useRouter();

  const { address } = useAccount();

  const { writeContract: writeChonkContract, error: writeChonkError } =
    useWriteContract();
  const { writeContract: writeTraitContract, error: writeTraitError } =
    useWriteContract();

  const mintChonk = () => {
    writeChonkContract({
      address: mainContract,
      abi: abi,
      functionName: "mint",
      args: [],
      chainId: baseSepolia.id,
    });
  };

  // trait minting is on another contract, so this wont actually work
  // minting is on the renderminter contract
  const mintTrait = () => {
    writeTraitContract({
      address: traitsContract,
      abi: traitsAbi,
      functionName: "mint",
      args: [],
      chainId: baseSepolia.id,
    });
  };

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
    abi: abi,
    functionName: "ownerOf",
    args: [BigInt(id)],
    chainId: baseSepolia.id,
  }) as { data: string };

  useEffect(() => {
    if (tokenURIData) {
      decodeAndSetData(tokenURIData, setTokenData);
    } else {
      console.log("No tokenURI data");
    }
  }, [tokenURIData]);

  // Get the trait ids that are equipped to the body
  const { data: equipment } = useReadContract({
    address: mainContract,
    abi,
    functionName: "getPeter",
    args: [BigInt(id)],
    chainId: baseSepolia.id,
  }) as { data: Equipment };

  useEffect(() => {
    if (!equipment) return;

    console.log("equipment", equipment);

    setCurrentChonk({
      tokenId: parseInt(id),
      hat: {
        tokenId:
          equipment.hatId === 0n ? null : parseInt(equipment.hatId.toString()),
        category: Category.Hat,
        isEquipped: equipment.hatId !== 0n,
      },
      hair: {
        tokenId:
          equipment.shirtId === 0n
            ? null
            : parseInt(equipment.shirtId.toString()),
        category: Category.Shirt,
        isEquipped: equipment.shirtId !== 0n,
      },
      glasses: {
        tokenId:
          equipment.glassesId === 0n
            ? null
            : parseInt(equipment.glassesId.toString()),
        category: Category.Glasses,
        isEquipped: equipment.glassesId !== 0n,
      },
      handheld: {
        tokenId:
          equipment.handheldId === 0n
            ? null
            : parseInt(equipment.handheldId.toString()),
        category: Category.Handheld,
        isEquipped: equipment.handheldId !== 0n,
      },
      shirt: {
        tokenId:
          equipment.shirtId === 0n
            ? null
            : parseInt(equipment.shirtId.toString()),
        category: Category.Shirt,
        isEquipped: equipment.shirtId !== 0n,
      },
      pants: {
        tokenId:
          equipment.pantsId === 0n
            ? null
            : parseInt(equipment.pantsId.toString()),
        category: Category.Pants,
        isEquipped: equipment.pantsId !== 0n,
      },
      shoes: {
        tokenId:
          equipment.shoesId === 0n
            ? null
            : parseInt(equipment.shoesId.toString()),
        category: Category.Shoes,
        isEquipped: equipment.shoesId !== 0n,
      },
    });
  }, [equipment]);

  const account = tokenboundClient.getAccount({
    tokenContract: mainContract,
    tokenId: id.toString(),
  });

  // Get all the traits that the TBA owns, equipped or not (ex  [1n, 2n, 3n, 4n, 5n])
  const { data: traitTokenIds } = useReadContract({
    address: traitsContract,
    abi: traitsAbi,
    functionName: "walletOfOwner",
    args: [account],
    chainId: baseSepolia.id,
  }) as { data: BigInt[] };

  console.log("traitTokenIds", traitTokenIds);

  // This gets the ids that are equipped to the chonk
  useEffect(() => {
    if (!equipment) return;

    console.log("equipment", equipment);

    const hatIdIndex =
      // @ts-ignore
      equipment.hatId === 0n
        ? null
        : traitTokenIds.findIndex((tokenId) => tokenId === equipment.hatId);

    const hairIdIndex =
      // @ts-ignore
      equipment.hairId === 0n
        ? null
        : traitTokenIds.findIndex((tokenId) => tokenId === equipment.hairId);

    const glassesIdIndex =
      // @ts-ignore
      equipment.glassesId === 0n
        ? null
        : traitTokenIds.findIndex((tokenId) => tokenId === equipment.glassesId);

    const handheldIdIndex =
      // @ts-ignore
      equipment.handheldId === 0n
        ? null
        : traitTokenIds.findIndex(
            (tokenId) => tokenId === equipment.handheldId
          );

    const shirtIdIndex =
      // @ts-ignore
      equipment.shirtId === 0n
        ? null
        : traitTokenIds.findIndex((tokenId) => tokenId === equipment.shirtId);

    const pantsIdIndex =
      // @ts-ignore
      equipment.pantsId === 0n
        ? null
        : traitTokenIds.findIndex((tokenId) => tokenId === equipment.pantsId);

    const shoesIdIndex =
      // @ts-ignore
      equipment.shoesId === 0n
        ? null
        : traitTokenIds.findIndex((tokenId) => tokenId === equipment.shoesId);

    const filteredTraitTokenIds = traitTokenIds.filter((tokenId, index) => {
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

    console.log("filteredTraitTokenIds", filteredTraitTokenIds);

    setFilteredTraitTokenIds(filteredTraitTokenIds);
  }, [traitTokenIds, equipment]);

  const handleNavigation = (direction: "prev" | "next") => {
    let newId = direction === "prev" ? parseInt(id) - 1 : parseInt(id) + 1;
    if (newId < 1) newId = 1;
    if (newId > 3) newId = 3; // temp
    router.push(`/chonk/${newId}`);
  };

  return (
    <>
      <div className="w-full border-b border-gray-200 py-4 px-6 mb-8">
        <div className="w-[1280px] mx-auto flex justify-between items-center">
          <h1 className="text-[48px] font-bold uppercase">Chonks</h1>
          <div className="flex flex-row gap-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={mintChonk}
            >
              Mint a Chonk
            </button>
            <button
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={mintTrait}
            >
              Mint a Trait
            </button>
            <ConnectKitButton />
          </div>
        </div>
      </div>

      <div className="w-[1280px] mx-auto ">
        {tokenData ? (
          <div>
            <div className="flex flex-row justify-center gap-4 ">
              <div className="flex flex-row items-center gap-6">
                <button
                  className={`mb-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 ${
                    parseInt(id) === 1 ? "opacity-50" : ""
                  }`}
                  onClick={() => handleNavigation("prev")}
                  disabled={parseInt(id) <= 1}
                >
                  Previous
                </button>

                <Image
                  src={tokenData.image}
                  alt={tokenData.name}
                  width={400}
                  height={400}
                />
                <button
                  className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => handleNavigation("next")}
                >
                  Next
                </button>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-center mt-4 mb-1">
                {tokenData.name}
              </h1>

              {owner && (
                <p className="text-center mb-4">
                  Owned by{" "}
                  <strong>
                    {address === owner ? "You" : truncateEthAddress(owner)}
                  </strong>
                </p>
              )}

              <div className="flex grid-cols-3 gap-4 justify-center">
                {tokenData.attributes.map((attribute, index) => (
                  <div
                    className="flex flex-col bg-gray-200 p-4 rounded"
                    key={index}
                  >
                    <p className="text-sm text-center text-gray-500">
                      {attribute.trait_type}
                    </p>
                    <p className="text-md text-center">{attribute.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center mt-8">
              {/* Unequipped stuff grid */}
              {/* TODO: update back to filteredTraitTokenIds */}
              {traitTokenIds && traitTokenIds.length > 0 && (
                <EquipmentContainer
                  chonkId={id.toString()}
                  traitTokenIds={traitTokenIds}
                />
              )}
            </div>

            {/* <div className="flex flex-row mt-2">
            {equipment &&
              Object.keys(equipment).map((key, index) => {
                if (
                  key === "epoch" ||
                  key === "seed" ||
                  key === "isRevealed" ||
                  key === "bodyIndex"
                )
                  return null;

                const stored = equipment;

                // @ts-ignore
                if (stored[key] == 0n) return null;

                // console.log(stored[key].toString());

                return (
                  <div key={index}>
                    <EquippedTrait
                      chonkId={id}
                      // @ts-ignore
                      traitTokenId={stored[key].toString()}
                    />
                  </div>
                );
              })}
          </div> */}
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
