export const ModalWrapper = ({
  isOpen,
  onClose,
  children,
  localListingPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  localListingPending?: boolean;
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-[5px]"
      onClick={(e) => {
        // Prevents closing if user is waiting to sign the txn
        if (localListingPending) return;

        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white p-8 max-w-md w-full mx-4 min-w-[25vw]">
        {children}
      </div>
    </div>
  );
};
