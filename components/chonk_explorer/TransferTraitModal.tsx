import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Address } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import { mainContract } from "@/contract_data";
import { useOwnedChonks } from "@/hooks/useOwnedChonks";

interface Props {
  tokenboundClient: TokenboundClient;
  chonkId: string;
  address: Address | undefined;
  closeModal: () => void;
  handleModalBackgroundClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTransfer: (toTbaAddress: Address) => void;
  traitName: string;
}

export default function TransferTraitModal({
  tokenboundClient,
  chonkId,
  address,
  closeModal,
  handleModalBackgroundClick,
  onTransfer,
  traitName,
}: Props) {

  const { ownedChonks } = useOwnedChonks(address);

  const [selectedChonkId, setSelectedChonkId] = useState<string | null>(null);

  const handleTransfer = () => {
    if (!selectedChonkId) return;

    const tbaAddress = tokenboundClient.getAccount({
      tokenContract: mainContract,
      tokenId: selectedChonkId,
    }) as Address;

    onTransfer(tbaAddress);
  };

  // Filter out the current chonk from available chonks and map to required format
  const availableChonks = ownedChonks
    .filter(chonk => chonk.id !== chonkId)
    .map(chonk => chonk.id)
    .sort((a, b) => Number(a) - Number(b));

return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleModalBackgroundClick}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-medium">Transfer Your {traitName}</h2>
        </div>

        <div className="mb-4">
          <label className="block text-[14px] font-medium text-gray-700 mb-2">
            Select the Chonk to Transfer To
          </label>
          <select
            className="w-full text-sm px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
            value={selectedChonkId || ""}
            onChange={(e) => setSelectedChonkId(e.target.value)}
          >
            <option value="">Select a Chonk</option>

            {availableChonks.map((chonkId) => (
              <option key={chonkId} value={chonkId}>
                Chonk #{chonkId}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            className="px-4 py-2 border border-black hover:bg-gray-100"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleTransfer}
            disabled={!selectedChonkId}
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
