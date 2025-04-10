import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IoCartOutline,
  IoSparklesOutline,
  IoBriefcaseOutline,
  IoExitOutline,
  IoPricetagOutline,
  IoHandRightOutline,
  IoArrowRedoOutline,
  IoBackspaceOutline,
} from "react-icons/io5";
import { FaEthereum } from "react-icons/fa6";
import { formatDistanceToNow } from "date-fns";
import { truncateEthAddress } from "@/utils/truncateEthAddress";
import { formatEther, zeroAddress } from "viem";
import { Address } from "viem";
import client from "@/lib/apollo-client";
import { GET_CHONK_HISTORY } from "@/lib/graphql/queries";
import DisplayAddress from "@/components/shared/DisplayAddress";


interface ActivitySectionProps {
  tokenId: string;
  address?: Address | undefined;
}

type ChonkTransaction = {
  amount: string;
  bidder: string;
  from: string;
  id: string;
  seller: string;
  sellerTBA: string;
  time: string;
  to: string;
  txHash: string;
  txType: string; // todo: get all the values here
};

export default function ActivityAndOffersSection({
  tokenId,
  address,
}: ActivitySectionProps) {
  const [chonkHistory, setChonkHistory] = useState<ChonkTransaction[]>([]);

  // const [isOffersOpen, setIsOffersOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(true);

  useEffect(() => {
    const fetchChonkHistory = async () => {
      const response = await client.query({
        query: GET_CHONK_HISTORY,
        variables: { id: tokenId },
      });

      if (!response.data) return;

      const transactions = response.data.chonk.transactions.items;

      // Loop through transactions and log the transaction type
      // if (transactions && transactions.length > 0) {
      //   transactions.forEach((transaction: any) => {

      //     console.log("Transaction Type:", transaction.txType);
      //     console.log("Transaction Time:", transaction.time);
      //     console.log("Transaction From:", transaction.from);
      //     console.log("Transaction To:", transaction.to);
      //     // Log the entire transaction object
      //     console.log("Transaction Data:", transaction);
      //     // Convert Unix timestamp to readable date
      //     const date = new Date(transaction.time * 1000);
      //     console.log("Transaction Date:", date.toLocaleString());
      //     console.log("");
      //   });
      // } else {
      //   console.log("No transactions found");
      // }

      setChonkHistory(transactions);
      // debugger;
    };

    fetchChonkHistory();
  }, []);

  const renderTransactionType = (txType: string) => {
    switch (txType) {
      case "ChonkOfferCanceled":
        return (
          <>
          <IoBackspaceOutline className="mr-2" />Listing Canceled
        </>
        );
      case "ChonkOffered":
        return (
          <>
            <IoPricetagOutline className="mr-2" /><strong>Listing</strong>
          </>
        );
      case "ChonkMinted":
        return (
          <>
            <IoSparklesOutline className="mr-2" /><strong>Minted</strong>
          </>
        );
      case "ChonkTransferred":
        return (
          <>
            <IoArrowRedoOutline className="mr-2" />Transfer
          </>
        );
      case "ChonkOfferCreated":
        return (
         "Chonk Offer Created"
        );
      case "ChonkOfferAccepted":
        return (
         "Chonk Offer Accepted"
        );
      case "ChonkOfferUpdated":
        return (
         "Chonk Offer Updated"
        );
      case "ChonkBought":
        return (
          <>
            <IoCartOutline className="mr-2" /><strong>Sale</strong>
          </>
        );
      case "ChonkBidEntered":
        return (
          <>
            <IoHandRightOutline className="mr-2" /><strong>Bid Placed</strong>
          </>
        );
      case "ChonkBidWithdrawn":
        return (
         "Bid Withdrawn"
        );
      case "ChonkBidAccepted":
        return (
          <>
            <IoCartOutline className="mr-2" /><strong>Sale (Bid Accepted)</strong>
          </>
        );
      default:
        return txType;
    }
  };

  return (
    <>
      {/* mx-4 sm:mx-0 mt-[1.725vw] pt-[1.725vw] */}
      <div className="mx-4 sm:mx-0 mt-[3.45vw] border border-black p-[1.725vw]">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsActivityOpen(!isActivityOpen)}
        >
          <h3 className="text-xl font-bold">
            {/* Listings &amp; Bids {isEventsLoading && "(Loading...)"} */}
            Activity
          </h3>
          <svg
            className={`w-4 h-4 transform transition-transform ${
              isActivityOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {isActivityOpen && (
          <div className="mt-[1.725vw] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 uppercase">
                  <th className="text-left py-2 font-normal">Event</th>
                  <th className="text-left py-2 font-normal">Price</th>
                  <th className="text-left py-2 font-normal">From</th>
                  <th className="text-left py-2 font-normal">To</th>
                  <th className="text-right py-2 font-normal">Time</th>
                </tr>
              </thead>
              <tbody>
              {chonkHistory.slice().reverse().map((transaction) => (

                <tr key={transaction.txHash} className="border-b border-gray-200">

                    {/* Event */}
                    <td className="py-2 flex items-center">
                      {renderTransactionType(transaction.txType)}
                    </td>

                    {/* Price */}
                    <td className="py-2">
                      {transaction.txType === "ChonkMinted" || transaction.txType === "ChonkTransferred" || transaction.txType === "ChonkOfferCanceled" ? (
                         "-"
                      ) : (
                        <span className="inline-flex items-center whitespace-nowrap">
                        {"amount" in transaction ? (
                          <>
                            {formatEther(BigInt(transaction.amount))}{" "}
                            <FaEthereum className="ml-1 text-[1vw]" />
                          </>
                        ) : (
                          "-"
                        )}
                      </span>
                      )}
                    </td>

                    {/* From */}
                    <td className="py-2">
                      {transaction.txType === "ChonkMinted"
                      || transaction.txType === "ChonkOfferCanceled"
                      // || transaction.txType === "ChonkTransferred"
                      ? (
                        <span>-</span>
                      ) : (
                        <DisplayAddress address={transaction.from as Address} />
                      )}
                    </td>

                    {/* To */}
                    <td className="py-2">
                      {transaction.txType === "ChonkOffered"
                      || transaction.txType === "ChonkBidEntered"
                      || transaction.txType === "ChonkOfferCanceled"
                      ? (
                        <span>-</span>
                      ) : (
                        <DisplayAddress address={transaction.to as Address} />
                      )}
                    </td>

                    {/* Time */}
                    <td className="py-2 text-right">
                      {/* {new Date(parseInt(transaction.time) * 1000).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )} */}
                       <Link
                          href={`https://basescan.org/tx/${transaction.txHash}`}
                          target="_blank"
                          className="flex items-center justify-end hover:underline"
                        >

                            {/* {new Date(parseInt(transaction.time) * 1000).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )} */}
                             {formatDistanceToNow(new Date(parseInt(transaction.time) * 1000), {
                              addSuffix: true,
                            })}
                            <IoExitOutline className="ml-2" />
                        </Link>
                    </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </>
  );
}
