import { Category } from "@/types/Category";
import {
  useTraitData,
  useTraitType,
  useTraitName,
  useEquipFunction,
} from "@/hooks/traitHooks";

export const categoryList = Object.values(Category);

interface Props {
  chonkId: string;
  traitTokenId: string;
  isEquipped: boolean;
}

export default function Trait(props: Props) {
  const { chonkId, traitTokenId, isEquipped } = props;

  const traitData = useTraitData(traitTokenId);
  const traitType = useTraitType(traitTokenId);
  const traitName = useTraitName(traitTokenId);

  const { equip, unequip } = useEquipFunction(
    chonkId,
    traitTokenId,
    traitType,
    isEquipped
  );

  return traitData ? (
    <div className="relative w-[200px] h-[200px]">
      <img src={traitData.image} className="w-full h-full" />
      <button
        className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white py-2"
        onClick={isEquipped ? unequip : equip}
        disabled={isEquipped && traitName == ""}
      >
        <span className={isEquipped && traitName == "" ? "opacity-50" : ""}>
          {isEquipped ? "Unequip" : "Equip"} {traitName}
        </span>
      </button>
    </div>
  ) : null;
}
