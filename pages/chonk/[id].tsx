import { useEffect, useState } from "react";
import { baseSepolia } from "viem/chains";
import { useReadContract, useWalletClient } from "wagmi";
import { TokenboundClient } from "@tokenbound/sdk";
import { Chonk } from "@/types/Chonk";
import {
  mainContract,
  traitsContract,
  tokenURIABI,
  traitsAbi,
} from "@/contract_data";
import { useRouter } from "next/navigation";
import { Address } from "viem";

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

  const { data: balanceOf } = useReadContract({
    address: traitsContract,
    abi: [
      {
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: [account],
  });

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
            {account &&
              balanceOf &&
              Array.from({ length: Number(balanceOf) }, (_, index) => (
                <div key={index}>
                  <Trait account={account} index={index.toString()} />
                </div>
              ))}
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

const Trait = ({ account, index }: { account: Address; index: string }) => {
  const [traitData, setTraitData] = useState<Chonk | null>(null);

  const { data: tokenId } = useReadContract({
    address: traitsContract,
    abi: traitsAbi,
    functionName: "tokenOfOwnerByIndex",
    args: [account, index],
    chainId: baseSepolia.id,
  }) as { data: string };

  const { data: traitTokenURIData } = useReadContract({
    address: traitsContract,
    abi: tokenURIABI,
    functionName: "tokenURI",
    args: [tokenId],
    chainId: baseSepolia.id,
  }) as { data: string };

  useEffect(() => {
    if (traitTokenURIData) decodeAndSetData(traitTokenURIData, setTraitData);
  }, [traitTokenURIData]);

  return traitData ? (
    <img src={traitData.image} className="w-[200px] h-[200px]" />
  ) : null;
};
