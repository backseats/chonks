import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { marketplaceContract, marketplaceABI, chainId } from "@/config";

interface Props {
  chonkId: number;
  address: string | undefined;
  className?: string;
  onSuccess: () => void;
}

export default function WithdrawBidButton({
  chonkId,
  address,
  className = "",
  onSuccess,
}: Props) {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    writeContract: withdrawBidOnChonk,
    isPending: isWithdrawBidOnChonkPending,
    data: hashWithdrawBidOnChonk,
  } = useWriteContract();

  const {
    isLoading: isWithdrawBidOnChonkLoading,
    isSuccess: isWithdrawBidOnChonkSuccess,
    isError: isWithdrawBidOnChonkError,
    data: receiptWithdrawBidOnChonk,
  } = useWaitForTransactionReceipt({
    hash: hashWithdrawBidOnChonk,
  });

  useEffect(() => {
    if (isWithdrawBidOnChonkSuccess) {
      setIsSuccess(true);
      onSuccess();
      // const timer = setTimeout(() => setIsSuccess(false), 3000);
      // return () => clearTimeout(timer);
    }
  }, [isWithdrawBidOnChonkSuccess]);

  const handleWithdrawBidOnChonk = () => {
    if (!address || !chonkId) return;
    try {
      withdrawBidOnChonk(
        {
          address: marketplaceContract,
          abi: marketplaceABI,
          functionName: "withdrawBidOnChonk",
          args: [BigInt(chonkId)],
          chainId,
        },
        {
          onError: (error) => {
            console.log("Withdrawal transaction rejected:", error);
            alert(
              error.message.includes("MustWaitToWithdrawBid")
                ? "You must wait 100 seconds before cancelling your offer"
                : "Error cancelling offer: " + error.message
            );
          },
        }
      );
    } catch (error) {
      console.error("Error withdrawing bid:", error);
      alert("Error withdrawing bid: " + error);
    }
  };

  const baseStyle = "w-full py-2 px-4 transition-colors text-white";
  const style = `${baseStyle} ${className} ${
    isSuccess
      ? "bg-green-500"
      : isWithdrawBidOnChonkPending
      ? "bg-red-500 opacity-50"
      : "bg-red-500 hover:bg-red-600"
  }`;

  return (
    <button
      className={style}
      onClick={handleWithdrawBidOnChonk}
      disabled={isWithdrawBidOnChonkPending || isWithdrawBidOnChonkLoading}
    >
      {isWithdrawBidOnChonkPending || isWithdrawBidOnChonkLoading
        ? "Confirm with your wallet"
        : isSuccess
        ? "Offer was cancelled"
        : "Cancel your offer"}
    </button>
  );
}
