import { useEffect, useState } from "react";
import { Category } from "@/types/Category";
import {
  useTraitData,
  useTraitType,
  useTraitName,
  useEquip,
  useUnequip,
  useIsRevealed,
} from "@/hooks/traitHooks";
import { useTBATransferTrait } from "@/hooks/useTBATransferTrait";
import { Address } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import TransferTraitModal from "./TransferTraitModal";

export const categoryList = Object.values(Category);

interface Props {
  chonkId: string;
  address: Address | undefined;
  traitTokenId: string;
  tbaAddress: Address;
  toTbaAddress?: Address | null;
  isEquipped: boolean;
  selectedCategory: string;
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
    selectedCategory,
    isYours,
    tokenboundClient,
    tbaAddress,
    isEquipPending,
    setIsEquipPending,
  } = props;

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const { transferTrait } = useTBATransferTrait(tokenboundClient);

  // A data object w/ name, desc, image, attributes
  const traitData = useTraitData(traitTokenId);
  // e.g. "Hair"
  const traitType = useTraitType(traitTokenId);
  // e.g. "Blue Pants"
  const traitName = useTraitName(traitTokenId);

  const isRevealed = useIsRevealed(traitTokenId);

  const { handleEquip, equipHash, equipReceipt, isEquipSuccess } = useEquip(
    chonkId,
    traitTokenId
  );

  const unequipResult = useUnequip(chonkId, traitType);
  const { handleUnequip, unequipHash, unequipReceipt, isUnequipSuccess } =
    unequipResult || {};

  console.log("equipHash", equipHash);
  console.log("equipReceipt", equipReceipt);
  console.log("isEquipSuccess", isEquipSuccess);

  console.log("unequipHash", unequipHash);
  console.log("unequipReceipt", unequipReceipt);
  console.log("isUnequipSuccess", isUnequipSuccess);

  useEffect(() => {
    if (isEquipSuccess) setIsEquipPending(!isEquipPending);
    if (isUnequipSuccess) setIsEquipPending(!isEquipPending);
  }, [isEquipSuccess, isUnequipSuccess]);

  if (
    !isEquipped &&
    selectedCategory !== "All" &&
    selectedCategory !== traitType
  ) {
    console.log("returning null");
    return null;
  }

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

  return traitData ? (
    <>
      <div
        className="relative w-full h-full text-lg sm:text-[15px]"
        data-token-id={traitTokenId}
      >
        {!isEquipped && isYours && (
          <button
            className="absolute top-0 right-0 bg-black bg-opacity-50 text-white py-1 px-2 text-sm"
            onClick={() => setIsTransferModalOpen(true)}
          >
            Transfer
          </button>
        )}

        {isYours && (
          <button
            className="absolute top-0 left-0 bg-black  bg-opacity-50 text-white py-1 px-2 text-sm"
            onClick={() =>
              (window.location.href = `/market/traits/${traitTokenId}`)
            }
          >
            List This Trait
          </button>
        )}

        <img
          src={isRevealed ? traitData.image : "/unrevealed.svg"}
          className="w-full h-full object-contain"
          alt={traitName || "Trait"}
        />

        {isYours ? (
          <button
            className={buttonClass}
            onClick={
              isRevealed ? (isEquipped ? handleUnequip : handleEquip) : () => {}
            }
            disabled={!isRevealed || (isEquipped && traitName == "")}
          >
            <span
              className={
                (isEquipped && traitName == "") || !isRevealed
                  ? "opacity-50"
                  : ""
              }
            >
              {isRevealed
                ? isEquipped
                  ? `Unequip ${traitName}`
                  : `Equip ${traitName}`
                : "Revealing Soon"}
            </span>
          </button>
        ) : (
          <button className={buttonClass} onClick={() => {}}>
            <span
              className={
                (isEquipped && traitName == "") || !isRevealed
                  ? "opacity-50"
                  : ""
              }
            >
              {isRevealed ? traitName : "Revealing Soon"}
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
          traitName={`${traitName} ${traitType}`}
        />
      )}
    </>
  ) : (
    <div className="relative w-full h-full" />
  );
}
