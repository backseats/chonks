import Link from "next/link";
import { useState, useEffect } from "react";
// import { Chonk } from "@/types/Chonk";
import { Address } from "viem";
import client from "@/lib/apollo-client";
import { GET_CHONKS_BY_EOA } from "@/lib/graphql/queries";
import MarketplaceConnectKitButton from "../marketplace/common/MarketplaceConnectKitButton";

interface ListingsProps {
  isSidebarVisible: boolean;
  address: Address | undefined;
}

type Chonk = {
  id: number;
  activeListing: boolean;
};

export default function Listings({ isSidebarVisible, address }: ListingsProps) {
  const [chonks, setChonks] = useState<
    Array<{ id: number; data: Chonk | null }>
  >([]);

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

        // console.log("GraphQL chonks result:", response);

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

  useEffect(() => {
    if (!allChonkTokenIds) return;

    const fetchChonks = async () => {
      const chonksArray = [];
      for (let i = 1; i <= Number(allChonkTokenIds.length); i++) {
        chonksArray.push({
          id: allChonkTokenIds[i - 1].id,
          data: null,
        });
      }

      setChonks(chonksArray);
    };

    fetchChonks();
  }, [allChonkTokenIds]);

  // Fetch token URI data for each token
  useEffect(() => {
    const fetchTokenURIs = async () => {
      const updatedChonks = [...chonks];

      for (const chonk of updatedChonks) {
        if (chonk.data === null) {
          try {
            const response = await fetch(
              `/api/chonks/renderAsDataUri2d/${chonk.id}`
            );
            const data = await response.json();
            chonk.data = data;
          } catch (error) {
            console.error(
              `Error fetching token URI for Chonk #${chonk.id}:`,
              error
            );
          }
        }
      }

      setChonks(updatedChonks);
    };

    if (chonks.length > 0 && chonks.some((chonk) => chonk.data === null)) {
      fetchTokenURIs();
    }
  }, [chonks]);

  return (
    <div className="w-full">
      {!address && (
        <div className="flex flex-col border border-black bg-white p-4 h-[300px justify-center items-center">
          <p className="text-lg">Connect your wallet to view your chonks</p>
          <MarketplaceConnectKitButton />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-0">
        {chonks.map(({ id, data }) => (
          <Link
            href={`/chonks/${id}`}
            key={id}
            className="flex flex-col border border-black bg-white hover:opacity-90 transition-opacity"
          >
            {data === null ? (
              <div className="flex flex-col bg-white p-4 aspect-square justify-center items-center text-lg">
                Loading...
              </div>
            ) : (
              <img
                // src={data.image}
                alt={`Chonk #${id}`}
                className="w-full h-auto"
              />
            )}

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
