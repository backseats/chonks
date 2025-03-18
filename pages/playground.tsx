import { useState, useEffect } from "react";
import useListChonk from "@/hooks/marketplace/chonks/useListChonk";
import useCancelOffer from "@/hooks/marketplace/chonks/useCancelOffer";

export default function Playground() {
  const {
    handleListChonk,
    isListChonkPending,
    isListChonkSuccess,
    isListingRejected,
    listChonkHash,
    isListChonkError,
    listChonkReceipt,
    hasActiveOffer,
    refetchChonkOffer,
  } = useListChonk("0xA1454995CcCC837FaC7Ef1D91A1544730c79B306", Number(1));

  const {
    handleCancelOfferChonk,
    isCancelOfferChonkPending,
    isCancelOfferChonkSuccess,
    isCancelOfferChonkError,
    isCancelOfferChonkRejected,
    cancelOfferChonkHash,
    cancelOfferChonkReceipt,
  } = useCancelOffer("0xA1454995CcCC837FaC7Ef1D91A1544730c79B306", Number(1));

  const cancelElement = (
    <TransactionButton
      startText="Cancel Listing"
      inFlightText="List Chonk"
      onClick={() => handleCancelOfferChonk()}
      states={{
        isPending: isCancelOfferChonkPending,
        isSuccess: isCancelOfferChonkSuccess,
        isRejected: isCancelOfferChonkRejected,
        isError: isCancelOfferChonkError,
        hash: cancelOfferChonkHash,
        receipt: cancelOfferChonkReceipt,
      }}
      successAction={() => {
        if (cancelOfferChonkReceipt) window.location.reload();
      }}
    />
  );

  const listElement = (
    <TransactionButton
      startText="List Chonk"
      inFlightText="Cancel Listing"
      onClick={() => handleListChonk("10000000000000000000", null)}
      states={{
        isPending: isListChonkPending,
        isSuccess: isListChonkSuccess,
        isRejected: isListingRejected,
        isError: isListChonkError,
        hash: listChonkHash,
        receipt: listChonkReceipt,
      }}
      successElement={cancelElement}
      successAction={() => refetchChonkOffer()}
    />
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">Transaction State Playground</h1>

      {hasActiveOffer ? cancelElement : listElement}
    </div>
  );
}

////

interface Props {
  startText: string;
  inFlightText: string;
  onClick: () => void;
  states: {
    isPending: boolean;
    isSuccess: boolean;
    isRejected: boolean;
    isError: boolean;
    hash: `0x${string}` | undefined;
    receipt: any;
  };
  successElement?: React.ReactElement;
  successAction?: () => void;
}

export function TransactionButton(props: Props) {
  const {
    startText,
    inFlightText,
    onClick,
    states,
    successElement,
    successAction,
  } = props;

  // Determine the current state based on the states object
  const currentState = (() => {
    if (states.isPending) return "pending";
    if (states.hash && !states.receipt) return "inFlight";
    if (states.hash && states.isSuccess && states.receipt) return "success";
    if (states.isRejected) return "rejected";
    if (states.isError) return "error";
    return "notStarted";
  })();

  // Add state to track if we should show success element
  const [showSuccessElement, setShowSuccessElement] = useState(false);
  // Create a visual state that can be reset on error click
  const [visualState, setVisualState] = useState(currentState);

  useEffect(() => {
    if (currentState === "success") {
      // Call success action immediately
      successAction?.();

      // But delay showing the success element
      const timer = setTimeout(() => {
        setShowSuccessElement(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // Reset when not in success state
      setShowSuccessElement(false);
    }
  }, [currentState, successAction]);

  useEffect(() => setVisualState(currentState), [currentState]);

  const getButtonStyles = () => {
    // Use visualState instead of currentState for styling

    const notStartedAndSuccess = "bg-gray-200 hover:bg-gray-300 text-gray-800";
    const pending = `${notStartedAndSuccess} opacity-50`;

    switch (visualState) {
      case "notStarted":
        return notStartedAndSuccess;
      case "pending":
        return pending;
      case "inFlight":
        return pending;
      case "success":
        return notStartedAndSuccess;
      case "error":
        return "bg-red-200 hover:bg-red-300 text-red-800";
      case "rejected":
        return "bg-purple-200 hover:bg-purple-300 text-purple-800";
    }
  };

  const getButtonText = () => {
    // Use visualState instead of currentState for text
    switch (visualState) {
      case "notStarted":
        return startText;
      case "pending":
        return "Confirm with your wallet";
      case "inFlight":
        return inFlightText;
      case "success":
        return inFlightText;
      case "error":
        return "Transaction Error";
      case "rejected":
        return "Transaction Rejected";
    }
  };

  const handleClick = () => {
    if (
      (currentState === "error" || currentState === "rejected") &&
      visualState !== "notStarted"
    ) {
      // Reset visual state to notStarted when clicked in error state
      setVisualState("notStarted");
      return;
    }
    onClick();
  };

  return (
    <>
      {currentState === "success" && successElement && showSuccessElement ? (
        successElement
      ) : (
        <div className="flex flex-col items-center">
          <button
            className={`px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${getButtonStyles()}`}
            onClick={handleClick}
            disabled={currentState === "pending" || currentState === "inFlight"}
          >
            {getButtonText()}
          </button>

          {visualState === "error" ||
            (visualState === "rejected" && (
              <div className="mt-2 text-red-600 font-medium">
                {visualState === "rejected"
                  ? "Confirm with your wallet to continue"
                  : "Try again, an error occurred"}
              </div>
            ))}
        </div>
      )}
    </>
  );
}
