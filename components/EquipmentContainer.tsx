import { useState } from "react";
import Trait from "@/components/Trait";
import { Equipment } from "@/types/Equipment";

interface Props {
  traitTokenIds: BigInt[];
  equipment: Equipment;
}

export default function EquipmentContainer(props: Props) {
  const { traitTokenIds, equipment } = props;

  // console.log("traits i own", traitTokenIds);
  // console.log("current equipment", equipment);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const isTokenIdEquipped = (tokenId: BigInt): boolean => {
    for (const key in equipment) {
      if (key !== "tokenId" && equipment[key as keyof Equipment] === tokenId) {
        return true;
      }
    }
    return false;
  };

  const getEquipMethodName = (key: string): string | null => {
    if (key === "shirtId") {
      return "equipShirt";
    } else if (key === "pantsId") {
      return "equipPants";
    }
    return null;
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
        {traitTokenIds.map((tokenId, index) => {
          const isEquipped = isTokenIdEquipped(tokenId);
          if (isEquipped) return null;

          let functionName = null;
          for (const key in equipment) {
            if (key === "tokenId") continue;

            if (equipment[key as keyof Equipment] !== tokenId) {
              functionName = getEquipMethodName(key);
              break;
            }
          }

          // TODO: figure out why this isn't working
          return (
            <Trait
              key={index}
              tokenId={tokenId.toString()}
              isEquipped={isEquipped}
              functionName={functionName}
            />
          );
        })}
      </div>
    </div>
  );
}
