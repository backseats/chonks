import { useEffect, useState } from "react";
import { baseSepolia } from "viem/chains";
import { useReadContract, useWalletClient } from "wagmi";
import { TokenboundClient } from "@tokenbound/sdk";
import { Chonk } from "@/types/Chonk";
import { mainContract, traitsContract, tokenURIABI } from "@/contract_data";
import { useRouter } from "next/navigation";

function decodeAndSetData(data: string, setData: (data: Chonk) => void) {
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
  const [traitData1, setTraitData1] = useState<Chonk | null>(null);
  const [traitData2, setTraitData2] = useState<Chonk | null>(null);

  const generatedObject = {
    "1": [1, 2],
    "2": [3, 4],
    "3": [5, 6],
  };

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

  const account = tokenboundClient.getAccount({
    tokenContract: mainContract,
    tokenId: id.toString(),
  });

  const { data: traitTokenURIData1 } = useReadContract({
    address: traitsContract,
    abi: tokenURIABI,
    functionName: TOKEN_URI,
    args: [BigInt(generatedObject[id][0])],
    chainId: baseSepolia.id,
  }) as { data: string };

  const { data: traitTokenURIData2 } = useReadContract({
    address: traitsContract,
    abi: tokenURIABI,
    functionName: TOKEN_URI,
    args: [BigInt(generatedObject[id][1])],
    chainId: baseSepolia.id,
  }) as { data: string };

  useEffect(() => {
    if (traitTokenURIData1) decodeAndSetData(traitTokenURIData1, setTraitData1);
  }, [traitTokenURIData1]);

  useEffect(() => {
    if (traitTokenURIData2) decodeAndSetData(traitTokenURIData2, setTraitData2);
  }, [traitTokenURIData2]);

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
          </div>

          <div className="flex flex-row mt-2">
            {traitData1 ? (
              <>
                <img src={traitData1.image} className="w-[200px] h-[200px]" />
              </>
            ) : null}

            {traitData2 ? (
              <>
                <img src={traitData2.image} className="w-[200px] h-[200px]" />
              </>
            ) : null}
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
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

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
