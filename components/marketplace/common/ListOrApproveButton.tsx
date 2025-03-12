interface Props {
  traitId?: number | null;
  isApprovalPending: boolean;
  finalIsApproved: boolean;
  handleApproveMarketplace: () => void;
  setIsModalOpen: (open: boolean) => void;
  approvalError: string | null;
}

export default function ListOrApproveButton({
  traitId,
  isApprovalPending,
  finalIsApproved,
  handleApproveMarketplace,
  setIsModalOpen,
  approvalError,
}: Props) {
  return (
    <>
      <button
        className="w-full bg-chonk-blue text-white py-2 px-4 hover:brightness-110 transition-colors"
        onClick={() => {
          if (!finalIsApproved) {
            try {
              handleApproveMarketplace();
            } catch (error) {
              console.error("Error approving marketplace:", error);
            }
          } else {
            setIsModalOpen(true);
          }
        }}
      >
        {isApprovalPending
          ? "Sign with your wallet"
          : finalIsApproved
          ? `List Your ${traitId ? `Trait` : "Chonk"}`
          : "Approve Marketplace to Trade"}
      </button>

      {approvalError && (
        <div className="text-red-500 text-sm text-center">{approvalError}</div>
      )}
    </>
  );
}
