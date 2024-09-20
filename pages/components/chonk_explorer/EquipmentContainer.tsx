import { useState } from "react";
import Trait from "./Trait";
import CategoryButton from "./CategoryButton";

interface Props {
  chonkId: string;
  traitTokenIds: BigInt[];
}

export default function EquipmentContainer(props: Props) {
  const { chonkId, traitTokenIds } = props;

  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    "Hats",
    "Hair",
    "Glasses",
    "Handheld",
    "Shirt",
    "Pants",
    "Shoes",
  ];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // what i really want to do here is take the traitTokenIds and get their traitType which i can do with the `useTraitType` hook

  // then i filter below by the selectedCategory

  return (
    <div className="flex flex-col pt-4">
      {traitTokenIds.length > 0 ? (
        <>
          <div className="flex flex-row gap-2">
            {categories.map((category) => (
              <CategoryButton
                key={category}
                category={category}
                selectedCategory={selectedCategory}
                onClick={() => handleCategoryChange(category)}
              />
            ))}
          </div>

          <div className="grid grid-cols-4 gap-4 mt-4">
            {traitTokenIds.map((tokenId, index) => (
              <Trait
                key={index}
                chonkId={chonkId}
                traitTokenId={tokenId.toString()}
                isEquipped={false}
                selectedCategory={selectedCategory}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="text-lg">No Traits to Display</p>
      )}
    </div>
  );
}
