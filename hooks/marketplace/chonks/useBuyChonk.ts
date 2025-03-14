import { useState } from "react";
import { marketplaceContract, marketplaceABI } from "@/config";
import { useWriteContract } from "wagmi";
import { parseEther } from "viem";

export default function useBuyChonk(chonkId: number) {
  const [buyChonkError, setBuyChonkError] = useState<string | null>(null);

  const {
    writeContract: buyChonk,
    isPending: isBuyChonkPending,
    isSuccess: isBuyChonkSuccess,
    isError: isBuyChonkError,
  } = useWriteContract();

  const handleBuyChonk = (priceInEth: number) => {
    buyChonk({
      address: marketplaceContract,
      abi: marketplaceABI,
      functionName: 'buyChonk',
      args: [BigInt(chonkId)],
      value: parseEther(priceInEth.toString()),
    }, {
      onError: (error) => {
        console.error('Error buying chonk:', error);

        if (error.message.includes("User denied transaction signature")) {
          setBuyChonkError("Please confirm with your wallet to buy");
        } else {
          setBuyChonkError(error.message);
        }
      },
    });
  }

  return {
    handleBuyChonk,
    isBuyChonkPending,
    isBuyChonkSuccess,
    isBuyChonkError,
    buyChonkError,
  };
}
