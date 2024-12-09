import { Category } from "@/types/Category";
import Link from "next/link";
import {
  useTraitData,
  useTraitType,
  useTraitName,
  useEquipFunction,
  useIsRevealed,
} from "@/hooks/traitHooks";
import { useTBATransferTrait } from "@/hooks/useTBATransferTrait";
import { Address } from "viem";
export const categoryList = Object.values(Category);

interface Props {
  chonkId: string;
  traitTokenId: string;
  isEquipped: boolean;
  selectedCategory: string;
  isYours: boolean;
  tbaAddress: Address;
  tbaAddress2: Address;
}

export default function Trait(props: Props) {
  const { chonkId, traitTokenId, isEquipped, selectedCategory, isYours, tbaAddress, tbaAddress2 } =
    props;

  const { transferTrait } = useTBATransferTrait(tbaAddress, tbaAddress2, traitTokenId);

  console.log("traitTokenId", traitTokenId);

  // A data object w/ name, desc, image, attributes
  const traitData = useTraitData(traitTokenId);
  // e.g. "Hair"
  const traitType = useTraitType(traitTokenId);
  // e.g. "Blue Pants"
  const traitName = useTraitName(traitTokenId);

  // console.log("tbaAddress", tbaAddress);
  // console.log("tbaAddress2", tbaAddress2);
  // console.log("traitTokenId", traitTokenId);

  const isRevealed = useIsRevealed(traitTokenId);

  const { equip, unequip } = useEquipFunction(
    chonkId,
    traitTokenId,
    traitType,
    isEquipped
  );

  if (
    !isEquipped &&
    selectedCategory !== "All" &&
    selectedCategory !== traitType
  ) {
    console.log("returning null");
    return null;
  }

  return traitData ? (
    <>
      <div className="relative w-[200px] h-[200px] max-w-[200px] max-h-[200px]">
        <img src={isRevealed ? traitData.image : "/unrevealed.svg"} className="w-full h-full" />

        {isYours ? (
          <button
            className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white py-2"
            onClick={isRevealed ? (isEquipped ? unequip : equip) : () => { }}
            disabled={!isRevealed || (isEquipped && traitName == "")}
          >
            <span className={isEquipped && traitName == "" || !isRevealed ? "opacity-50" : ""}>
              {isRevealed ? (isEquipped ? `Unequip ${traitName}` : `Equip ${traitName}`) : "Revealing Soon"}
            </span>
          </button>
        ) : (
          <button
            className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white py-2"
            onClick={() => { }}
          >
            <span className={isEquipped && traitName == "" || !isRevealed ? "opacity-50" : ""}>
              {isRevealed ? traitName : "Revealing Soon"}
            </span>
          </button>
        )}
        {/* {!isEquipped && (
          <Link className="no-underline hover:underline text-chonk-blue py-2"
            onClick={(e) => {
              e.preventDefault();
              transferTrait();
            }}
            href="#"
          >
            Transfer Trait
          </Link>
        )} */}
      </div> 
    </>
  ) : (
    <div className="relative w-[200px] h-[200px]"></div>
  );
}
