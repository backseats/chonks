import { useEffect, useState } from "react";
import client from "@/lib/apollo-client";
import { GET_CHONK_HISTORY } from "@/lib/graphql/queries";
import Link from "next/link";
import { formatEther, zeroAddress } from "viem";
import { truncateEthAddress } from "@/utils/truncateEthAddress";

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

export default function History() {
  const [chonkHistory, setChonkHistory] = useState<ChonkTransaction[]>([]);

  useEffect(() => {
    const fetchChonkHistory = async () => {
      const response = await client.query({
        query: GET_CHONK_HISTORY,
        variables: { id: "1" },
      });

      if (!response.data) return;

      const transactions = response.data.chonk.transactions.items;

      // // Loop through transactions and log the transaction type
      // if (transactions && transactions.length > 0) {
      //   transactions.forEach((transaction: any) => {
      //     console.log("Transaction Type:", transaction.txType);
      //     console.log("Transaction Time:", transaction.txType);
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
          <div className="bg-gradient-to-b from-blue-300 to-blue-400 text-white py-2 px-4 rounded-md shadow-sm">
            <span>Chonk Offer Canceled</span>
          </div>
        );
      case "ChonkOffered":
        return (
          <div className="bg-gradient-to-b from-blue-500 to-blue-600 text-white py-2 px-4 rounded-md shadow-sm">
            <span>Chonk Offered for Sale</span>
          </div>
        );
      case "ChonkMinted":
        return (
          <div className="bg-gradient-to-b from-green-500 to-green-600 text-white py-2 px-4 rounded-md shadow-sm">
            <span>Chonk Minted</span>
          </div>
        );
      case "ChonkTransferred":
        return (
          <div className="bg-gradient-to-b from-gray-500 to-gray-600 text-white py-2 px-4 rounded-md shadow-sm">
            <span>Chonk Transferred</span>
          </div>
        );
      // case "ChonkOfferCreated":
      //   return "Chonk Offer Created";
      // case "ChonkOfferAccepted":
      //   return "Chonk Offer Accepted";
      // case "ChonkOfferUpdated":
      //   return "Chonk Offer Updated";
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Chonk History</h1>
      <div className="flex flex-col gap-4">
        {chonkHistory.map((transaction) => (
          <div className="flex flex-row items-center" key={transaction.txHash}>
            <div className="flex-shrink-0">
              {renderTransactionType(transaction.txType)}
            </div>

            {/* TODO: ENS */}
            {transaction.txType === "ChonkTransferred" &&
              transaction.from !== zeroAddress && (
                <span className="ml-[6px]">
                  {truncateEthAddress(transaction.from)} to{" "}
                  {truncateEthAddress(transaction.to)}
                </span>
              )}

            {transaction.txType === "ChonkOffered" && (
              <span className="ml-[6px]">
                for {formatEther(BigInt(transaction.amount))} ETH
              </span>
            )}

            <span className="mx-[6px]">on</span>

            <Link
              href={`https://basescan.org/tx/${transaction.txHash}`}
              target="_blank"
              className="underline flex-shrink-0"
            >
              <div className="flex-shrink-0">
                {new Date(parseInt(transaction.time) * 1000).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
