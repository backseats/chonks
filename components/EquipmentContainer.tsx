import { useEffect, useState } from "react";
import Trait from "@/components/Trait";
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

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="flex flex-col pt-4">
      <div className="flex flex-row gap-2">
        <button
          className={`rounded-md px-4 py-2 ${
            selectedCategory === "All"
              ? "bg-black text-white"
              : "bg-gray-500 text-white hover:bg-black"
          }`}
          onClick={() => handleCategoryChange("All")}
        >
          All
        </button>

        {/* <button
                  className={`rounded-md px-4 py-2 ${
                    selectedCategory === "Hats"
                      ? "bg-black text-white"
                      : "bg-gray-500 text-white hover:bg-black"
                  }`}
                  onClick={() => handleCategoryChange("Hats")}
                >
                  Hats
                </button>
                <button
                  className={`rounded-md px-4 py-2 ${
                    selectedCategory === "Hair"
                      ? "bg-black text-white"
                      : "bg-gray-500 text-white hover:bg-black"
                  }`}
                  onClick={() => handleCategoryChange("Hair")}
                >
                  Hair
                </button>
                <button
                  className={`rounded-md px-4 py-2 ${
                    selectedCategory === "Glasses"
                      ? "bg-black text-white"
                      : "bg-gray-500 text-white hover:bg-black"
                  }`}
                  onClick={() => handleCategoryChange("Glasses")}
                >
                  Glasses
                </button>
                <button
                  className={`rounded-md px-4 py-2 ${
                    selectedCategory === "Handheld"
                      ? "bg-black text-white"
                      : "bg-gray-500 text-white hover:bg-black"
                  }`}
                  onClick={() => handleCategoryChange("Handheld")}
                >
                  Handheld
                </button> */}
        <button
          className={`rounded-md px-4 py-2 ${
            selectedCategory === "Shirt"
              ? "bg-black text-white"
              : "bg-gray-500 text-white hover:bg-black"
          }`}
          onClick={() => handleCategoryChange("Shirt")}
        >
          Shirt
        </button>
        <button
          className={`rounded-md px-4 py-2 ${
            selectedCategory === "Pants"
              ? "bg-black text-white"
              : "bg-gray-500 text-white hover:bg-black"
          }`}
          onClick={() => handleCategoryChange("Pants")}
        >
          Pants
        </button>
        {/* <button
                  className={`rounded-md px-4 py-2 ${
                    selectedCategory === "Shoes"
                      ? "bg-black text-white"
                      : "bg-gray-500 text-white hover:bg-black"
                  }`}
                  onClick={() => handleCategoryChange("Shoes")}
                >
                  Shoes
                </button> */}
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
