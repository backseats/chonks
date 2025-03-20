import { useState, useEffect } from "react";
import Link from "next/link";
import { Address } from "viem";
import client from "@/lib/apollo-client";
import { GET_CHONKS_BY_EOA } from "@/lib/graphql/queries";
import MarketplaceConnectKitButton from "../marketplace/common/MarketplaceConnectKitButton";
import { useReadContract } from "wagmi";
import { mainContract, mainABI } from "@/config";

type Chonk = {
  id: number;
  activeListing: boolean;
};

export default function Listings({
  address,
}: {
  address: Address | undefined;
}) {
  const [allChonkTokenIds, setAllChonkTokenIds] = useState<Chonk[]>([]);

  useEffect(() => {
    if (!address) return;

    const fetchChonksFromGraphQL = async () => {
      try {
        const response = await client.query({
          query: GET_CHONKS_BY_EOA,
          variables: { eoa: address.toLowerCase() },
          fetchPolicy: "cache-first",
          context: {
            ttl: 600, // 10 minutes
          },
        });

        console.log("GraphQL chonks result:", response);

        if (!response.data) {
          console.error("No data returned from GraphQL query");
          return;
        }

        setAllChonkTokenIds(
          response.data!.chonks.items.map((chonk: Chonk) => ({
            id: Number(chonk.id),
            isActiveListing: Boolean(chonk.activeListing),
          }))
        );
      } catch (error) {
        console.error("Error fetching chonks from GraphQL:", error);
      }
    };

    fetchChonksFromGraphQL();
  }, [address]);

  return (
    <div className="w-full">
      {!address && (
        <div className="flex flex-col border border-black bg-white p-4 h-[300px justify-center items-center">
          <p className="text-lg">Connect your wallet to see your Chonks</p>
          <MarketplaceConnectKitButton />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-0">
        {allChonkTokenIds.map(({ id }) => (
          <Link
            href={`/chonks/${id}`}
            key={id}
            className="flex flex-col border border-black bg-white hover:opacity-90 transition-opacity"
          >
            <Chonk id={id} />

            <div className="space-y-2 p-4">
              <h3 className="text-[3.45vw] sm:text-[16px] font-bold">
                Chonk #{id}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const Chonk = ({ id }: { id: number }) => {
  const { data: tokenURI, isLoading } = useReadContract({
    address: mainContract,
    abi: mainABI,
    functionName: "renderAsDataUri2D",
    args: [BigInt(id)],
  });

  if (isLoading)
    return (
      <div className="flex flex-col bg-white p-4 aspect-square justify-center items-center text-lg">
        Loading...
      </div>
    );

  const tokenURIString = tokenURI as string;
  const base64String = tokenURIString.split(",")[1];
  const jsonString = atob(base64String);
  const jsonData = JSON.parse(jsonString);

  return (
    <img src={jsonData.image} alt={`Chonk #${id}`} className="w-full h-auto" />
  );
};
