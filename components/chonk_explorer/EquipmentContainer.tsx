import { useState } from "react";
import Trait from "./Trait";
import CategoryButton from "./CategoryButton";
import { Address } from "viem";
import { TokenboundClient } from "@tokenbound/sdk";
import { useAccount } from "wagmi";

interface Props {
  chonkId: string;
  tbaAddress: Address;
  traitTokenIds: BigInt[];
  isYours: boolean;
  tokenboundClient: TokenboundClient;
}

export default function EquipmentContainer(props: Props) {
  const { chonkId, tbaAddress, traitTokenIds, isYours, tokenboundClient } = props;
  const { address } = useAccount();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    "Head",
    "Hair",
    "Face",
    "Accessory",
    "Top",
    "Bottom",
    "Shoes",
  ];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <>
      {traitTokenIds.length > 0 ? (
        <>
          {/* <div className="flex flex-row gap-2">
            {categories.map((category) => (
              <CategoryButton
                key={category}
                category={category}
                selectedCategory={selectedCategory}
                onClick={() => handleCategoryChange(category)}
              />
            ))}
          </div> */}

          {traitTokenIds.map((tokenId, index) => (
            <div key={index}>
              <Trait
                key={index}
                chonkId={chonkId}
                traitTokenId={tokenId.toString()}
                isEquipped={false}
                selectedCategory={selectedCategory}
                isYours={isYours}
                tokenboundClient={tokenboundClient}
                tbaAddress={tbaAddress}
                address={address}
              />
            </div>
          ))}
        </>
      ) : (
        <p className="text-lg text-gray-500">No Traits to Display</p>
      )}
    </>
  );
}
