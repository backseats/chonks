import { useEffect, useMemo, useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { Address, formatEther } from "viem";
import { chainId } from "@/config";

////////////////////////////////////////////////////////////////////////

// TransactionButton: Write -> Wait -> onSuccess Refetch (which gets next button from parent view)

////////////////////////////////////////////////////////////////////////

type TransactionButtonProps = {
  buttonStyle: "primary" | "secondary" | "simple";
  address: Address;
  abi: any[];
  args: any[];
  functionName: string;
  label: string;
  inFlightLabel: string;
  priceInWei?: bigint;
  onSuccess?: () => void;
  setError: (e: string | null) => void;
  reset: () => void;
  setIsCancelingOffer?: (isCancelingOffer: boolean) => void;
};

function TransactionButton(props: TransactionButtonProps) {
  const {
    buttonStyle,
    address,
    abi,
    args,
    functionName,
    label,
    inFlightLabel,
    priceInWei,
    onSuccess,
    setError,
    reset,
    setIsCancelingOffer,
  } = props;

  const [isSimulating, setIsSimulating] = useState(false);
  const [bottomError, setBottomError] = useState<string | null>(null);

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId });

  // 1. Write the transaction (with pre-simulation)
  const {
    writeContract,
    data: writeContractHash,
    isPending: isWriteContractPending,
    error: writeContractError,
  } = useWriteContract();

  // 2. Wait for the transaction to be mined
  const {
    data: receipt,
    isLoading: isWaiting,
    error: waitingError,
  } = useWaitForTransactionReceipt({
    hash: writeContractHash,
  });

  // 3. On success, call the onSuccess callback
  useEffect(() => {
    if (receipt) onSuccess?.();
  }, [receipt]);

  useEffect(() => {
    if (writeContractError) setIsCancelingOffer?.(false);
  }, [writeContractError]);

  const processError = (error: string) => {
    if (error.includes("User denied transaction signature")) {
      setError("Confirm the transaction to continue");
      setIsCancelingOffer?.(false);
    } else if (error.includes("MustWaitToWithdrawBid")) {
      // TODO: get the block from the contract and make it more dynamic
      setError("Wait one minute before withdrawing your Bid");
    } else if (error.includes("CantBeZero")) {
      setError("Price must be at least 0.0001 ETH");
    } else if (error.includes("exceeds the balance of the account")) {
      setError(
        `You need at least ${formatEther(
          priceInWei!
        )} ETH to purchase this Chonk`
      );
    } else {
      setError(error);
    }
  };

  /// Handle Click
  const handleClick = async () => {
    reset();
    setIsSimulating(true);

    try {
      // Must connect wallet. Should never hit this
      if (!walletClient) {
        return;
      }

      const simulation = await publicClient?.simulateContract({
        address: address,
        abi,
        functionName,
        args,
        value: priceInWei,
        account: walletClient.account!,
      });

      if (!simulation) {
        setBottomError("Simulation failed");
        return;
      }

      setIsCancelingOffer?.(true);

      await writeContract(simulation.request);
    } catch (err: any) {
      processError(err.message || "Simulation or transaction failed");
    } finally {
      setIsSimulating(false);
    }
  };

  const isDisabled = useMemo(() => {
    return isSimulating || isWriteContractPending || isWaiting;
  }, [isSimulating, isWriteContractPending, isWaiting]);

  const buttonLabel = useMemo(() => {
    if (isSimulating) return label;
    if (isWriteContractPending) return "Confirm with your wallet";
    if (isWaiting) return inFlightLabel;
    return label;
  }, [isSimulating, isWriteContractPending, isWaiting, inFlightLabel, label]);

  // Determine button style based on variant prop
  const style = useMemo(() => {
    if (buttonStyle === "primary") {
      return "bg-[#2F7BA7] hover:bg-[#2F7BA7] text-white";
    } else if (buttonStyle === "secondary") {
      return "bg-gray-300 hover:bg-gray-400 text-gray-800";
    } else if (buttonStyle === "simple") {
      return "bg-white text-black px-4 py-[10px] rounded-lg hover:bg-gray-100 transition-colors duration-200 mr-3 mt-4 text-sm border-2 border-black disabled:opacity-50 ";
    }
  }, [buttonStyle]);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`${
          isDisabled ? "opacity-50" : "cursor-pointer"
        } ${style} px-4 py-2 transition-colors duration-200 text-[18px]`}
      >
        {buttonLabel}
      </button>

      {bottomError && (
        <span className="text-red-500 text-sm text-center mt-2 -mb-4">
          {bottomError}
        </span>
      )}
    </div>
  );
}

export default TransactionButton;
