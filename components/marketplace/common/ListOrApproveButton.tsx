interface Props {
  traitId?: number | null;
  isApprovalPending: boolean;
  finalIsApproved: boolean;
  approvalError: string | null;
  hasActiveBid: boolean;
  isEquipped: boolean;
  handleApproveMarketplace?: () => void;
  handleTBAApproveMarketplace?: () => Promise<void>;
  setIsModalOpen: (open: boolean) => void;
  handleUnequipTrait?: () => void;
}

export default function ListOrApproveButton({
  traitId,
  isApprovalPending,
  finalIsApproved,
  handleApproveMarketplace,
  handleTBAApproveMarketplace,
  setIsModalOpen,
  approvalError,
  hasActiveBid,
  isEquipped,
  handleUnequipTrait,
}: Props) {
  return (
    <>
      <button
        className={`text-[18px] w-full bg-chonk-blue text-white py-2 px-4 hover:brightness-110 transition-colors ${
          isApprovalPending ? "opacity-50" : ""
        }`}
        onClick={async () => {
          if (!finalIsApproved) {
            try {
              handleTBAApproveMarketplace
                ? await handleTBAApproveMarketplace()
                : handleApproveMarketplace?.();
            } catch (error) {
              console.error("Error approving marketplace:", error);
            }
          } else {
            traitId && isEquipped
              ? handleUnequipTrait?.()
              : setIsModalOpen(true);
          }
        }}
      >
        {isApprovalPending
          ? "Confirm with your wallet"
          : finalIsApproved
          ? traitId && isEquipped
            ? "Unequip to List"
            : `List My ${traitId ? `Trait` : "Chonk"}`
          : `Approve the Market to List ${hasActiveBid ? "or accept Bid" : ""}`}
      </button>

      <div className="flex flex-row justify-between">
        <div className="text-red-500 text-sm text-center">{approvalError}</div>

        {!traitId && !finalIsApproved && (
          <div className="relative group">
            <div className="text-xs cursor-pointer text-right text-gray-500 hover:text-gray-700 mt-2">
              Why do I need to do this again?
            </div>
            <div className="absolute bottom-full right-0 mb-2 w-64 bg-black text-white text-xs p-2 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              We were a bit overzealous with our security and we clear approvals
              when a Chonk changes hands. This does not apply to Traits.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
