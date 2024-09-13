import { useEffect, useState } from "react";
import Trait from "@/pages/components/chonk_explorer/Trait";
import { Equipment } from "@/types/Equipment";
import { Category } from "@/types/Category";

// {
//     tokenId: BigInt;
//     cateogry: Category,
//     isEquipped: Boolean;
//   }

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

  return (
    <div className="flex flex-col pt-4">
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
          />
        ))}
      </div>
    </div>
  );
}

const CategoryButton = ({
  category,
  selectedCategory,
  onClick,
}: {
  category: string;
  selectedCategory: string;
  onClick: () => void;
}) => (
  <button
    className={`rounded-md px-4 py-2 ${
      selectedCategory === category
        ? "bg-black text-white"
        : "bg-gray-500 text-white hover:bg-black"
    }`}
    onClick={onClick}
  >
    {category}
  </button>
);
