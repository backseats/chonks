import { useEffect, useState } from "react";
import { Category } from "@/types/Category";
import { useEquip, useUnequip, useIsRevealed } from "@/hooks/traitHooks";
import { useTBATransferTrait } from "@/hooks/useTBATransferTrait";
import { Address } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import TransferTraitModal from "./TransferTraitModal";
import { useReadContract } from "wagmi";
import { chainId, colorMapABI, colorMapContract } from "@/config";
import ChonkRenderer from "@/components/ChonkRenderer";
import { TraitInfo } from "@/pages/chonks/[id]";

export const categoryList = Object.values(Category);

interface Props {
  chonkId: string;
  address: Address | undefined;
  traitTokenId: string;
  tbaAddress: Address;
  toTbaAddress?: Address | null;
  isEquipped: boolean;
  traitInfo: TraitInfo;
  isYours: boolean;
  tokenboundClient: TokenboundClient;
  isEquipPending: boolean;
  setIsEquipPending: (isPending: boolean) => void;
}

export default function Trait(props: Props) {
  const {
    chonkId,
    address = undefined,
    traitTokenId,
    isEquipped,
    traitInfo,
    isYours,
    tokenboundClient,
    tbaAddress,
    isEquipPending,
    setIsEquipPending,
  } = props;

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const { transferTrait } = useTBATransferTrait(tokenboundClient);

  const { data: bodyIndex } = useReadContract({
    address: colorMapContract,
    abi: colorMapABI,
    functionName: "getBodyIndexForChonk",
    args: [chonkId],
    chainId,
  }) as { data: number };

  const isRevealed = useIsRevealed(traitTokenId);

  const { handleEquip, equipHash, equipReceipt, isEquipSuccess } = useEquip(
    chonkId,
    traitTokenId
  );

  const unequipResult = useUnequip(chonkId, traitInfo.traitType);
  const { handleUnequip, unequipHash, unequipReceipt, isUnequipSuccess } =
    unequipResult || {};

  useEffect(() => {
    if (isEquipSuccess) setIsEquipPending(!isEquipPending);
    if (isUnequipSuccess) setIsEquipPending(!isEquipPending);
  }, [isEquipSuccess, isUnequipSuccess]);

  const handleTransferTrait = (toTbaAddress: Address) => {
    transferTrait(tbaAddress, toTbaAddress, traitTokenId);
    setIsTransferModalOpen(false);
  };

  const handleModalBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsTransferModalOpen(false);
    }
  };

  const buttonClass =
    "absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white py-2";

  return (
    <>
      <div
        className="relative w-full h-full text-lg sm:text-[15px]"
        data-token-id={traitTokenId}
      >
        <ChonkRenderer
          bytes={traitInfo.colorMap.slice(2)}
          bodyIndex={bodyIndex}
          opacity={0.6}
        />

        {!isEquipped && isYours && (
          <button
            className="absolute top-0 right-0 bg-black bg-opacity-50 text-white py-1 px-2 text-sm z-10"
            onClick={() => setIsTransferModalOpen(true)}
          >
            Transfer
          </button>
        )}

        {isYours && (
          <button
            className="absolute top-0 left-0 bg-black bg-opacity-50 text-white py-1 px-2 text-sm z-10"
            onClick={() =>
              (window.location.href = `/market/traits/${traitTokenId}`)
            }
          >
            List
          </button>
        )}

        {isYours ? (
          <button
            className={buttonClass}
            onClick={
              isRevealed ? (isEquipped ? handleUnequip : handleEquip) : () => {}
            }
            disabled={!isRevealed || (isEquipped && traitInfo.traitName == "")}
          >
            <span
              className={
                (isEquipped && traitInfo.traitName == "") || !isRevealed
                  ? "opacity-50"
                  : ""
              }
            >
              {isRevealed
                ? isEquipped
                  ? `Unequip ${traitInfo.traitName}`
                  : `Equip ${traitInfo.traitName}`
                : "Revealing Soon"}
            </span>
          </button>
        ) : (
          <button className={buttonClass} onClick={() => {}}>
            <span
              className={
                (isEquipped && traitInfo.traitName == "") || !isRevealed
                  ? "opacity-50"
                  : ""
              }
            >
              {isRevealed ? traitInfo.traitName : "Revealing Soon"}
            </span>
          </button>
        )}
      </div>

      {isTransferModalOpen && (
        <TransferTraitModal
          closeModal={() => setIsTransferModalOpen(false)}
          handleModalBackgroundClick={handleModalBackgroundClick}
          onTransfer={handleTransferTrait}
          tokenboundClient={tokenboundClient}
          chonkId={chonkId}
          address={address}
          traitName={`${traitInfo.traitName} ${traitInfo.traitType}`}
        />
      )}
    </>
  );
}
