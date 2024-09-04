import { useEffect, useState } from "react";
import { baseSepolia } from "viem/chains";
import { useReadContract, useWalletClient, useWriteContract } from "wagmi";
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
import { EquipmentStorage } from "@/types/Equipment";
import EquipmentContainer from "@/components/EquipmentContainer";
import EquippedTrait from "@/components/EquippedTrait";
import { Category } from "@/types/Category";
import Footer from "@/components/Footer";

type CurrentChonk = {
  tokenId: number;
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
  const { writeContract } = useWriteContract();

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
  }) as { data: EquipmentStorage };

  useEffect(() => {
    if (!equipment) return;

    console.log("equipment", equipment);

    // setCurrentChonk({
    //   tokenId: parseInt(id),
    //   shirt: {
    //     tokenId:
    //       equipment.stored.shirtId === 0n
    //         ? null
    //         : parseInt(equipment.stored.shirtId.toString()),
    //     category: Category.Shirt,
    //     isEquipped: equipment.stored.shirtId !== 0n,
    //   },
    //   pants: {
    //     tokenId:
    //       equipment.stored.pantsId === 0n
    //         ? null
    //         : parseInt(equipment.stored.pantsId.toString()),
    //     category: Category.Pants,
    //     isEquipped: equipment.stored.pantsId !== 0n,
    //   },
    // });
  }, [equipment]);

  const account = tokenboundClient.getAccount({
    tokenContract: mainContract,
    tokenId: id.toString(),
  });

  // Get all the traits that the TBA owns
  const { data: traitTokenIds } = useReadContract({
    address: traitsContract,
    abi: traitsAbi,
    functionName: "walletOfOwner",
    args: [account],
    chainId: baseSepolia.id,
  }) as { data: BigInt[] };

  // useEffect(() => {
  // if (!equipment) return;

  // const shirtIdIndex =
  //   // @ts-ignore
  //   equipment.stored.shirtId === 0n
  //     ? null
  //     : traitTokenIds.findIndex(
  //         (tokenId) => tokenId === equipment.stored.shirtId
  //       );

  // const pantsIdIndex =
  //   // @ts-ignore
  //   equipment.stored.pantsId === 0n
  //     ? null
  //     : traitTokenIds.findIndex(
  //         (tokenId) => tokenId === equipment.stored.pantsId
  //       );

  // const filteredTraitTokenIds = traitTokenIds.filter((tokenId, index) => {
  //   return index !== shirtIdIndex && index !== pantsIdIndex;
  // });

  // setFilteredTraitTokenIds(filteredTraitTokenIds);
  // }, [traitTokenIds, equipment]);

  const handleNavigation = (direction: "prev" | "next") => {
    let newId = direction === "prev" ? parseInt(id) - 1 : parseInt(id) + 1;
    if (newId < 1) newId = 1;
    if (newId > 3) newId = 3; // temp
    router.push(`/chonk/${newId}`);
  };

  return (
    <div className="flex flex-row gap-4">
      {tokenData ? (
        <div>
          <div className="flex flex-row gap-4">
            <img
              src={tokenData.image}
              alt={tokenData.name}
              className="w-[400px] h-[400px]"
            />

            <div>
              <h1>{tokenData.name}</h1>

              <ul>
                {tokenData.attributes.map((attribute, index) => (
                  <li key={index}>
                    {attribute.trait_type}: {attribute.value}
                  </li>
                ))}
              </ul>
            </div>

            {/* Unequipped stuff grid */}
            {filteredTraitTokenIds.length && (
              <EquipmentContainer
                chonkId={id.toString()}
                traitTokenIds={filteredTraitTokenIds}
              />
            )}
          </div>

          <div className="flex flex-row mt-2">
            {equipment?.stored &&
              Object.keys(equipment.stored).map((key, index) => {
                if (key === "epoch" || key === "seed") return null;

                const stored = equipment.stored;

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
          </div>

          <div className="flex flex-row mt-4 justify-between w-[400px]">
            <button
              className="w-1/2 underline"
              onClick={() => handleNavigation("prev")}
            >
              Previous
            </button>
            <button
              className="w-1/2 underline"
              onClick={() => handleNavigation("next")}
            >
              Next
            </button>
          </div>
          <div className="flex flex-row mt-4 justify-between w-[400px]">
            <button
              className="w-1/2 underline"
              onClick={() =>
                writeContract({
                  address: mainContract,
                  abi: abi,
                  functionName: "buyTrait",
                  args: [id],
                  chainId: baseSepolia.id,
                })
              }
            >
              Mint Trait
            </button>
            <button
              className="w-1/2 underline"
              onClick={() =>
                writeContract({
                  address: mainContract,
                  abi: abi,
                  functionName: "mint",
                  args: [],
                  chainId: baseSepolia.id,
                })
              }
            >
              Mint Body
            </button>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}

      <Footer />
    </div>
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
