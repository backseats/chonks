import { useEffect, useState } from "react";
import { baseSepolia } from "viem/chains";
import { useReadContract, useWalletClient } from "wagmi";
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
import EquippedTrait from "@/components/EquippedTrait";
import Equipment from "@/components/Equipment";

export function decodeAndSetData(data: string, setData: (data: Chonk) => void) {
  const base64String = data.split(",")[1];
  const jsonString = atob(base64String);
  const jsonData = JSON.parse(jsonString) as Chonk;

  setData(jsonData);
}

export default function ChonkDetail({ id }: { id: string }) {
  const TOKEN_URI = "tokenURI";
  const router = useRouter();

  const { data: walletClient } = useWalletClient();
  const tokenboundClient = new TokenboundClient({
    walletClient,
    chainId: baseSepolia.id,
  });

  const [tokenData, setTokenData] = useState<Chonk | null>(null);

  // Get main body tokenURI
  const { data: tokenURIData } = useReadContract({
    address: mainContract,
    abi: tokenURIABI,
    functionName: TOKEN_URI,
    args: [BigInt(id)],
    chainId: baseSepolia.id,
  }) as { data: string };

  useEffect(() => {
    if (tokenURIData) decodeAndSetData(tokenURIData, setTokenData);
  }, [tokenURIData]);

  // Get the trait ids that are equipped to the body
  const { data: equipment } = useReadContract({
    address: mainContract,
    abi,
    functionName: "getPeter",
    args: [BigInt(id)],
    chainId: baseSepolia.id,
  }) as { data: EquipmentStorage };

  const account = tokenboundClient.getAccount({
    tokenContract: mainContract,
    tokenId: id.toString(),
  });

  const { data: traitTokenIds } = useReadContract({
    address: traitsContract,
    abi: traitsAbi,
    functionName: "walletOfOwner",
    args: [account],
    chainId: baseSepolia.id,
  }) as { data: BigInt[] };

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

            {account && traitTokenIds && equipment && (
              <Equipment
                traitTokenIds={traitTokenIds}
                equipment={equipment.stored}
              />
            )}
          </div>

          <div className="flex flex-row mt-2">
            {equipment?.stored &&
              Object.keys(equipment.stored).map((key, index) => {
                if (key === "tokenId") return null;
                const stored = equipment.stored;

                // @ts-ignore
                if (stored[key] == 0n) return null;

                return (
                  <div key={index}>
                    {/* @ts-ignore */}
                    <EquippedTrait tokenId={stored[key].toString()} />
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
            <button className="w-1/2 underline" onClick={() => {}}>
              Mint Trait
            </button>
            <button className="w-1/2 underline" onClick={() => {}}>
              Mint Body
            </button>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
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
