import { Chonk } from "@/types/Chonk";
import { CurrentChonk } from "@/types/CurrentChonk";
import { Category } from "@/types/Category";
import Attributes from "@/components/marketplace/Attributes";

interface Props {
  chonkId: string;
  tokenData: Chonk | null;
  equippedTraits: CurrentChonk | null;
}

type Trait = {
  id: string;
  traitName: string;
  traitType: number; // Category id
};

export default function EquippedAttributes(props: Props) {
  const { chonkId, tokenData, equippedTraits } = props;

  if (!tokenData) return null;

  const orderedAttributes = tokenData.attributes
    .filter(
      (attr: any) =>
        attr.trait_type !== "Body" &&
        attr.trait_type !== undefined &&
        attr.value !== "None"
    )
    .sort((a: any, b: any) => {
      const aIndex = Object.values(Category).indexOf(a.trait_type as Category);
      const bIndex = Object.values(Category).indexOf(b.trait_type as Category);
      return aIndex - bIndex;
    });

  const traitsWithTokenIds: Trait[] = orderedAttributes.map(
    (attribute: any) => {
      const categoryKey =
        attribute.trait_type.toLowerCase() as keyof CurrentChonk;
      const equippedTrait = equippedTraits?.[categoryKey] as
        | {
            tokenId: number;
            category: Category;
            isEquipped: boolean;
          }
        | undefined;

      // Find the category number based on the trait_type string
      const categoryValues = Object.values(Category);
      const categoryIndex = categoryValues.indexOf(
        attribute.trait_type as Category
      );

      return {
        id: equippedTrait?.tokenId.toString() || "0",
        traitName: attribute.value,
        traitType: categoryIndex,
      };
    }
  );

  return orderedAttributes.length === 0 ? (
    <div className="mt-4 text-center text-[16px] text-gray-600">
      No Traits equipped
    </div>
  ) : (
    <Attributes chonkId={chonkId} attributes={traitsWithTokenIds} />
  );
}
